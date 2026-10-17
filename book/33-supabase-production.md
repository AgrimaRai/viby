# Chapter 33 — Supabase in Production

Your localhost Supabase has been a cozy sandbox — now we wire Viby to a real, hardened backend that thousands of strangers will hammer at 2am.

## What you'll learn
- How to stand up a dedicated **production** Supabase project (separate from dev)
- Shipping your schema with **migrations** instead of clicking around the dashboard
- Creating **Storage buckets** and writing RLS-style **storage policies** for avatars and post photos
- Configuring **auth providers**, the **Site URL**, and **redirect allow-lists** so OAuth and magic links land where they should
- Why **connection pooling** matters on serverless (Vercel) and which connection string to use
- Setting up **backups** and a sane disaster-recovery posture

## Prerequisites
- Chapter 9 (Supabase fundamentals & the `@supabase/ssr` clients)
- Chapter 12 (Auth flows: OAuth, magic links, sessions)
- Chapter 18 (Row Level Security and policies)
- Chapter 24 (Storage: uploading avatars and post images)
- Chapter 32 (Deploying Viby to Vercel and environment variables)

You should already have Viby running locally against a dev Supabase project. We're now creating its grown-up twin.

## Theory

Think of your dev Supabase project as a **kitchen at home**: if you spill flour, nobody cares. Production is a **restaurant kitchen during a Saturday dinner rush** — health inspectors, paying customers, and zero tolerance for "oops I dropped the users table." The skills are the same; the discipline is not.

Three ideas separate hobby backends from production ones.

**1. Environments are isolated, not shared.** You never point dev and prod at the same database. A bad migration or a `delete from profiles` you ran "just to test" must never be able to touch real users. So we keep at least two Supabase projects: `viby-dev` and `viby-prod`. They have different URLs, different keys, different data. This is the single most important habit in this chapter.

**2. Schema is code, not clicks.** In dev it's tempting to add a column in the dashboard table editor. That works once. But production schema must be **reproducible and reviewable** — you want the exact same tables to exist whether you rebuild from scratch tomorrow or onboard a teammate next year. The answer is **migrations**: ordered SQL files, committed to git, applied in sequence. The dashboard is for *looking*, not *changing*.

**3. Serverless changes how you connect.** Traditional servers open a handful of long-lived database connections and reuse them. Vercel runs your code as **functions that spin up and die constantly** — each cold start could try to open a brand-new Postgres connection. Postgres has a hard connection limit (often ~60 on small plans), so a traffic spike can exhaust it and your app starts throwing `too many connections`. The fix is a **connection pooler** (Supabase ships PgBouncer/Supavisor in front of Postgres): your functions talk to the pooler, the pooler multiplexes a small set of real connections to the database. Analogy: instead of every customer getting their own dedicated waiter forever, a small pool of waiters serves everyone, table by table.

A subtlety that trips everyone up: for the Viby app's *normal* runtime requests we use the Supabase JS client over HTTP (PostgREST) — that goes through Supabase's API layer, not a raw Postgres socket, so pooling is handled for you. You only think hard about pooling/connection strings when you connect to Postgres **directly** (an ORM like Prisma/Drizzle, a migration tool, or a cron worker). Keep that distinction in your head.

## In practice

### 1. Create the production project

In the Supabase dashboard: **New project** → name it `viby-prod`, pick a region **close to your Vercel deployment region** (latency between your functions and the DB is real), and set a strong database password (store it in your password manager — you'll need it for the direct connection string).

Once it's provisioning, grab three things from **Project Settings → API**:

- Project URL → `https://<ref>.supabase.co`
- `anon` public key
- `service_role` secret key (server-only — never ships to the browser)

### 2. Wire Viby's environment variables

On Vercel (Chapter 32), set these for the **Production** environment only. Your `.env.local` keeps the dev project's values.

```bash
# .env.production (managed in Vercel → Settings → Environment Variables)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROD_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...prod-anon...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...prod-service-role...   # server only, NOT NEXT_PUBLIC
```

Our `@supabase/ssr` clients from Chapter 9 don't change — they read those env vars. As a reminder, the server client uses the modern `getAll`/`setAll` cookie handlers:

```ts
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies(); // Next.js 16: cookies() is async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore; proxy refreshes the session.
          }
        },
      },
    }
  );
}
```

### 3. Ship the schema with migrations

Install and link the Supabase CLI, then keep all SQL in versioned files.

```bash
npm install -D supabase
npx supabase login

# Link your local repo to the PROD project (ref is in the dashboard URL)
npx supabase link --project-ref YOUR_PROD_REF

# Create a migration file
npx supabase migration new init_viby_schema
```

That creates `supabase/migrations/<timestamp>_init_viby_schema.sql`. Put real Viby schema in it:

```sql
-- supabase/migrations/20260530120000_init_viby_schema.sql

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  hobbies text[] default '{}',
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  image_url text,
  created_at timestamptz not null default now()
);

-- RLS is OFF by default on new tables — turn it ON or your data is public.
alter table public.profiles enable row level security;
alter table public.posts enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Users can insert their own posts"
  on public.posts for insert with check (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete using (auth.uid() = author_id);
```

Apply it to production:

```bash
npx supabase db push
```

The CLI runs only migrations the prod DB hasn't seen yet, in order. From now on, every schema change is a new migration file in a PR — never a dashboard edit. To pull an out-of-band change someone made in the dashboard back into code, run `npx supabase db pull` and commit the generated migration.

### 4. Storage buckets & policies

Avatars and post images live in Storage. Create buckets and lock them down with policies — also as migration SQL so they're reproducible:

```sql
-- supabase/migrations/20260530121000_storage.sql

-- Public bucket for avatars (readable by anyone, writable only by the owner)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- Anyone can read avatar files
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- A user may only write into a folder named after their own uid: avatars/<uid>/...
create policy "Users upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

The folder-prefix trick (`avatars/<uid>/avatar.png`) is the standard pattern: the policy checks that the first path segment equals the caller's `auth.uid()`, so a user can never overwrite someone else's file.

Uploading from Viby's profile editor (a Server Action) looks like:

```ts
// app/(app)/settings/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("avatar") as File;
  const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  revalidatePath("/settings");
}
```

### 5. Auth providers & redirect URLs

This is where most "it worked locally but breaks in prod" bugs live. In **Authentication → URL Configuration**:

- **Site URL**: `https://viby.app` (your real production domain — used as the default redirect)
- **Redirect URLs** (allow-list — Supabase rejects any redirect not listed):
  ```
  https://viby.app/**
  https://*-yourteam.vercel.app/**   # Vercel preview deployments
  http://localhost:3000/**           # local dev
  ```

For OAuth (say Google), enable the provider under **Authentication → Providers**, paste the Client ID/Secret from Google Cloud Console, and add Supabase's callback URL — `https://YOUR_PROD_REF.supabase.co/auth/v1/callback` — to Google's **Authorized redirect URIs**.

Your sign-in Server Action passes a `redirectTo` that must match the allow-list:

```ts
// app/(auth)/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin")!; // works in prod, preview, and local

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) throw error;
  if (data.url) redirect(data.url);
}
```

And the session refresh lives in **`proxy.ts`** (Next.js 16's middleware-style entry — not a `middleware.ts`):

```ts
// proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser(); // refreshes the token cookie on every request
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 6. Connection pooling (only for direct Postgres access)

If you add Drizzle, Prisma, or a cron worker that opens raw Postgres connections, use the **pooler** connection string from **Project Settings → Database → Connection string**, not the direct `5432` one:

```bash
# Transaction-mode pooler (port 6543) — best for serverless / Vercel functions
DATABASE_URL="postgresql://postgres.YOUR_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (port 5432) — use ONLY for migrations / long-lived workers
DIRECT_URL="postgresql://postgres.YOUR_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

Transaction mode (6543) doesn't support prepared statements or session features, which is why the `?pgbouncer=true` flag (and Prisma's separate `directUrl` for migrations) exists. The Viby app itself, using `@supabase/ssr` over HTTP, **needs none of this** — it's already pooled at the API layer.

### 7. Backups

On paid plans Supabase takes **daily automated backups** with **Point-in-Time Recovery (PITR)** available as an add-on — PITR lets you restore to any second, which is what you want the day someone fat-fingers a delete. Free tier projects can be **paused** and have limited backups, so production should be on at least the Pro plan. Verify under **Project Settings → Database → Backups**. Belt-and-suspenders: schedule a periodic `pg_dump` of critical tables to object storage you control, and **test a restore** before you need one — an untested backup is a rumor.

## Architecture / diagram

```mermaid
flowchart TD
  subgraph Vercel["Vercel (Production)"]
    SC[Server Components / Server Actions]
    PX[proxy.ts session refresh]
  end

  subgraph SB["Supabase viby-prod"]
    API[PostgREST + Auth API<br/>pooled at HTTP layer]
    POOL[Supavisor / PgBouncer<br/>:6543 transaction mode]
    PG[(PostgreSQL)]
    ST[Storage buckets<br/>avatars / posts]
  end

  Browser -->|cookies| PX --> SC
  SC -->|anon key over HTTPS| API
  SC -->|signed uploads| ST
  API --> PG
  ST --> PG

  Worker[Cron / ORM worker] -->|raw Postgres| POOL --> PG

  GOOGLE[Google OAuth] -->|callback URL| API
```

## Best practices & pitfalls

- **Do** keep `viby-dev` and `viby-prod` as separate projects with separate keys. **Don't** ever run experiments against prod.
- **Do** treat every schema change as a committed migration. **Don't** edit tables in the prod dashboard — it desyncs your migration history.
- **Do** enable RLS on every table immediately (new tables ship with it *off*). A forgotten `enable row level security` is the #1 Supabase data leak.
- **Don't** expose the `service_role` key to the browser — never prefix it with `NEXT_PUBLIC_`. It bypasses RLS entirely.
- **Do** include preview-deployment URLs (`https://*-yourteam.vercel.app/**`) in the redirect allow-list, or OAuth silently fails on PR previews.
- **Do** use the **6543 transaction pooler** for any serverless direct-Postgres access; reserve **5432** for migrations. **Don't** run app traffic on 5432 — you'll exhaust connections.
- **Do** put production on a plan with PITR and **test a restore**. **Don't** trust a backup you've never restored.
- **Do** call `supabase.auth.getUser()` (verifies with the auth server) for authorization decisions, not `getSession()` (reads the cookie, spoofable).

## Exercises

1. **Two-project hygiene.** Create `viby-prod`, copy its three API values into Vercel's Production env scope, and confirm `vercel env pull` shows prod values differ from your `.env.local`.
2. **Migrate, don't click.** Move Viby's full schema into `supabase/migrations/`, run `db push` against prod, then `supabase db reset` locally and confirm the app rebuilds identically from migrations alone.
3. **Storage lockdown.** Write a policy so a user can `delete` only their own files in the `posts` bucket. Verify by trying (and failing) to delete another user's object with the anon key.
4. **Redirect allow-list.** Deploy a PR to a Vercel preview URL, attempt Google sign-in, watch it fail, then add the wildcard preview pattern and confirm it works.
5. **Pooling proof (stretch).** Add Drizzle to a cron route, wire it to the 6543 pooler, and load-test it; then switch to 5432 and observe `too many connections` under concurrency.

## Mini-project — Production launch checklist for Viby

Build a one-time, admin-only **`/admin/health`** Server Component that verifies your production wiring at a glance. It should, on the server:

- Confirm `NEXT_PUBLIC_SUPABASE_URL` points at the **prod** ref (not dev).
- Query `select count(*) from profiles` to prove DB connectivity and RLS-as-service-role works.
- List Storage buckets via `supabase.storage.listBuckets()` and assert `avatars` and `posts` exist and are public.
- Render a green/red checklist (Tailwind v4 tokens, a little Framer Motion `AnimatePresence` for rows fading in) covering: env scope correct, RLS enabled on `profiles`/`posts`, redirect URLs configured (manual confirm checkbox), backups/PITR enabled (manual confirm).

Ship it behind an `is_admin` check in your profiles table. The goal: a single page you load right after deploy that tells you Viby's backend is truly production-ready — no guessing.

## Key takeaways
- Production = a **separate, isolated** Supabase project; never share keys or data with dev.
- **Migrations are the source of truth** for schema — dashboard edits desync your history.
- New tables ship with **RLS off**; turn it on everywhere, and never leak the `service_role` key.
- **Storage policies** use the folder-prefix-equals-`auth.uid()` pattern to scope writes per user.
- Auth breaks in prod when **Site URL** and the **redirect allow-list** (including preview URLs) aren't configured.
- Use the **6543 transaction pooler** for serverless direct-Postgres access; the `@supabase/ssr` HTTP client is already pooled.
- Put prod on a plan with **PITR backups** — and test a restore before you need one.

**Up next:** Chapter 34 — Observability & Error Tracking: wiring Sentry, structured logs, and uptime alerts so you *know* the moment Viby misbehaves in production.
