# Chapter 14 — Databases & PostgreSQL Data Modeling

> Your app is only as trustworthy as the data model underneath it — so let's design Viby's brain before we wire up its mouth.

Up to now, Viby has lived in memory. Zustand stores held your profiles, your swipes, your matches — and every refresh wiped the world clean. That was perfect for learning the front end. But a real social-discovery platform needs to *remember*: who you are, who you vibed with, who matched back, and what everyone is posting. This chapter is where Viby grows a permanent memory.

## What you'll learn

- What a relational database actually is, and why PostgreSQL is the industry default
- Tables, rows, columns, and how to choose good data types
- Primary keys and foreign keys — the glue that makes data *relational*
- The three relationship shapes: one-to-one (1:1), one-to-many (1:N), and many-to-many (N:M)
- Normalization — how to stop your data from rotting
- Indexes — how to make queries fast (and when not to)
- A complete, production-shaped schema for Viby: `profiles`, `swipes`, `matches`, `posts`, `messages`

## Prerequisites

- **Chapter 11–13** (Backend foundations): you understand servers, environment variables, and Supabase basics.
- **Chapter 8** (Auth): you know Supabase Auth issues a user in `auth.users` with a UUID `id`. We'll build *on top* of that.
- Comfort reading SQL is *not* assumed — we teach it here.

---

## Theory

### Why a relational database?

Imagine Viby's data as a giant shared spreadsheet workbook. Each *sheet* is a **table** (profiles, posts, messages). Each *row* is one record — one person, one post, one message. Each *column* is one attribute with a fixed type — a display name (text), an age (integer), a "created at" timestamp.

A **relational database** is that workbook with superpowers: it enforces *rules* (this column must be a valid email; this post must belong to a real user), it answers questions across sheets instantly ("show me every post by people I matched with this week"), and it guarantees that two requests at the same time don't corrupt each other (**ACID** transactions — Atomicity, Consistency, Isolation, Durability).

We use **PostgreSQL** because it's the open-source gold standard: rock-solid, feature-rich (JSON, full-text search, geospatial), and it's exactly what Supabase runs under the hood. When you write SQL for Supabase, you're writing real Postgres.

### Keys: the difference between a list and a graph

A **primary key (PK)** is the unique fingerprint of a row. No two rows in a table may share it. In Viby, a profile's primary key is its `id` (a UUID).

A **foreign key (FK)** is a column that *points* at another table's primary key. A `post.author_id` is a foreign key to `profiles.id`. This is the magic word "relational": foreign keys turn isolated lists into a connected graph, and the database *refuses* to let you create a post whose author doesn't exist (referential integrity).

> Analogy: a primary key is your passport number. A foreign key is your name written on a concert ticket — it only means something because it points back to a real passport.

### The three relationship shapes

**One-to-one (1:1)** — each row in A matches at most one row in B. Example: an `auth.users` record has exactly one `profiles` record. We model this by giving `profiles.id` the *same* value as the user's auth id.

**One-to-many (1:N)** — one row in A owns many rows in B, but each B belongs to one A. Example: one profile authors many posts. We put the FK on the "many" side: `posts.author_id`.

**Many-to-many (N:M)** — rows on both sides connect to many on the other. Example: profiles ↔ interests (you have many hobbies; each hobby has many fans). You can't store this with a single FK, so you introduce a **join table** (also called a junction or bridge table) that holds one row per pairing.

### Normalization — don't repeat yourself, with data

**Normalization** is the discipline of storing each fact exactly once. The classic smell is duplication: if you copy a user's display name into every post they write, then a name change means hunting down hundreds of rows — and you'll miss some, leaving Viby showing two names for one person.

The practical rules (first three normal forms, plain-English):

1. **1NF** — one value per cell. No comma-jammed lists like `"music,hiking,art"` in a single column.
2. **2NF** — every column depends on the *whole* primary key (matters for composite keys).
3. **3NF** — non-key columns depend only on the key, not on each other. Don't store `birth_year` *and* `age` — age is derivable.

Normalize first. **Denormalize later, deliberately**, only when measured performance demands it (e.g., a cached `like_count`).

### Indexes — the book's table of contents

Without an index, finding "all posts by author X" forces Postgres to scan *every* post (a sequential scan). An **index** is a sorted lookup structure (a B-tree) that turns that scan into a near-instant jump — exactly like the index at the back of a textbook.

The trade-off: indexes cost disk space and slow down writes (every insert must update the index too). So index the columns you **filter, join, or sort on** — and not much else. Foreign keys are almost always worth indexing.

---

## In practice

We'll build Viby's schema in the Supabase SQL Editor (Dashboard → SQL Editor) or as a migration file. Everything below is real Postgres.

### 1. The `profiles` table (1:1 with auth.users)

```sql
-- One profile per authenticated user.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  display_name text not null,
  bio         text,
  avatar_url  text,
  birth_year  smallint check (birth_year between 1900 and 2025),
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

Notice `id` is both the **primary key** *and* a **foreign key** to `auth.users(id)` — that's the 1:1 link. `on delete cascade` means: if the auth user is deleted, their profile vanishes automatically. `username unique` enforces no duplicate handles. `check` constraints reject bad data at the door.

### 2. Interests (N:M via a join table)

A profile has many interests; an interest has many fans. That's many-to-many.

```sql
create table public.interests (
  id    serial primary key,
  slug  text unique not null,    -- e.g. 'bouldering'
  label text not null            -- e.g. 'Bouldering'
);

-- The join table: one row per (profile, interest) pairing.
create table public.profile_interests (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  interest_id integer not null references public.interests (id) on delete cascade,
  primary key (profile_id, interest_id)   -- composite key prevents duplicates
);
```

The **composite primary key** `(profile_id, interest_id)` guarantees you can't add the same interest to a profile twice — and gives us a built-in index on the pairing.

### 3. Swipes and matches (the heart of discovery)

A **swipe** is a directed action: I vibed (or passed) on someone. A **match** is the mutual result.

```sql
create table public.swipes (
  id         uuid primary key default gen_random_uuid(),
  swiper_id  uuid not null references public.profiles (id) on delete cascade,
  swipee_id  uuid not null references public.profiles (id) on delete cascade,
  direction  text not null check (direction in ('vibe', 'pass')),
  created_at timestamptz not null default now(),
  -- you can only swipe a given person once
  unique (swiper_id, swipee_id),
  -- you can't swipe yourself
  check (swiper_id <> swipee_id)
);

create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  profile_a   uuid not null references public.profiles (id) on delete cascade,
  profile_b   uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- store the pair in a canonical order so (a,b) and (b,a) can't both exist
  check (profile_a < profile_b),
  unique (profile_a, profile_b)
);
```

The `profile_a < profile_b` trick is a pro move: by always storing the smaller UUID first, we make a match between two people *unique* regardless of who swiped first.

### 4. Posts (1:N) and messages (1:N within a match)

```sql
create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) <= 2000),
  image_url  text,
  like_count integer not null default 0,  -- deliberate denormalization
  created_at timestamptz not null default now()
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);
```

Messages belong to a `match` (you can only DM someone you matched with) *and* record who sent them — two foreign keys, both meaningful.

### 5. Indexes for the queries we'll actually run

```sql
-- "Show me a feed: recent posts by author."
create index posts_author_created_idx on public.posts (author_id, created_at desc);

-- "Have these two already swiped each other?"
create index swipes_swipee_idx on public.swipes (swipee_id);

-- "Load this match's messages in order."
create index messages_match_created_idx on public.messages (match_id, created_at);
```

These are **composite indexes** ordered to match our access patterns: filter by `match_id`, then sort by `created_at`. Postgres uses the leftmost columns, so order matters.

### 6. Reading it from Next.js 16 (Server Component + @supabase/ssr)

Now the payoff — querying the schema from a React Server Component. We use the `@supabase/ssr` server client with `getAll`/`setAll` cookie handlers.

```ts
// app/lib/supabase/server.ts
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

```tsx
// app/feed/page.tsx — a Server Component, no "use client" needed
import { createClient } from "@/app/lib/supabase/server";

export default async function FeedPage() {
  const supabase = await createClient();

  // Join posts -> profiles in ONE query using the FK relationship.
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `id, body, image_url, like_count, created_at,
       author:profiles ( username, display_name, avatar_url )`
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (
    <ul className="mx-auto max-w-md space-y-4 p-4">
      {posts.map((post) => (
        <li key={post.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-[--color-brand]">
            {post.author.display_name}
          </p>
          <p className="mt-1 text-sm text-gray-700">{post.body}</p>
        </li>
      ))}
    </ul>
  );
}
```

Supabase's `author:profiles ( ... )` syntax follows the `author_id` foreign key automatically — that's relational modeling paying dividends. The brand pink lives in a Tailwind v4 theme token (`@theme { --color-brand: #FF6FB5; }`), referenced as `[--color-brand]`.

### 7. Creating a swipe with a Server Action

```tsx
// app/actions/swipe.ts
"use server";

import { createClient } from "@/app/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordSwipe(swipeeId: string, direction: "vibe" | "pass") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Insert the swipe (the UNIQUE constraint blocks accidental double-swipes).
  const { error } = await supabase
    .from("swipes")
    .insert({ swiper_id: user.id, swipee_id: swipeeId, direction });

  if (error && error.code !== "23505") throw error; // 23505 = unique violation

  revalidatePath("/discover");
}
```

In production you'd promote the mutual-match check into a Postgres function/trigger so a match is created atomically — but the schema above is what makes that trigger trivial to write.

---

## Architecture / diagram

```mermaid
erDiagram
    auth_users ||--|| profiles : "1:1"
    profiles ||--o{ posts : "authors (1:N)"
    profiles ||--o{ swipes : "swiper (1:N)"
    profiles ||--o{ profile_interests : ""
    interests ||--o{ profile_interests : ""
    profiles ||--o{ matches : "in (1:N)"
    matches ||--o{ messages : "contains (1:N)"
    profiles ||--o{ messages : "sends (1:N)"

    profiles {
        uuid id PK_FK
        text username
        text display_name
    }
    swipes {
        uuid id PK
        uuid swiper_id FK
        uuid swipee_id FK
        text direction
    }
    matches {
        uuid id PK
        uuid profile_a FK
        uuid profile_b FK
    }
    posts {
        uuid id PK
        uuid author_id FK
        text body
    }
    messages {
        uuid id PK
        uuid match_id FK
        uuid sender_id FK
    }
```

`profile_interests` is the N:M join table bridging `profiles` and `interests`. Every other arrow is a 1:N relationship anchored by a foreign key.

---

## Best practices & pitfalls

- **Do** put foreign keys on the "many" side and index them. An unindexed FK is the #1 cause of mysterious slow joins.
- **Do** use `timestamptz` (timezone-aware), never naive `timestamp`. Store UTC, format in the UI.
- **Do** use UUIDs (`gen_random_uuid()`) for public-facing IDs so you don't leak row counts or invite enumeration attacks.
- **Do** enforce rules in the database with `check`, `unique`, and `not null`. The DB is your last line of defense; app code has bugs.
- **Don't** store lists in a single column (`"music,art"`). That breaks 1NF and makes filtering miserable — use a join table.
- **Don't** denormalize prematurely. Add a cached `like_count` only after you've measured the read cost.
- **Don't** forget **Row Level Security (RLS)**. In Supabase, a table with no RLS policy is wide open. Every table here needs `alter table ... enable row level security;` plus policies (covered next chapter).
- **Don't** delete rows you might need for audit/abuse review — consider a soft-delete `deleted_at timestamptz` column.

---

## Exercises

1. **Warm-up:** Add a `pronouns text` column and an `is_verified boolean not null default false` column to `profiles`. Write the `alter table` statements.
2. **Relationships:** Model a `post_likes` table so a user can like a post at most once. Which relationship shape is this, and what should the primary key be?
3. **Indexing:** A query filters `messages` by `match_id` and sorts newest-first, but it's slow. Write the exact `create index` that fixes it and explain the column order.
4. **Normalization:** You find `profiles.city` *and* `profiles.country` are repeated thousands of times with typos. Refactor into a `cities` table and an FK. Sketch the new schema.
5. **Challenge:** Write a SQL `check` constraint (or trigger) that prevents a user from messaging in a match they don't belong to. Why is the FK alone insufficient?

---

## Mini-project — "Vibes that matched"

Build a Server Component page at `app/matches/page.tsx` that shows the current user's matches with the *other* person's display name and avatar.

**Requirements:**
1. Query `matches` where the logged-in user is either `profile_a` or `profile_b` (hint: `.or("profile_a.eq...,profile_b.eq...")`).
2. For each match, resolve the *other* profile (the one that isn't you) and show their `display_name` + `avatar_url`.
3. For each match, fetch the most recent message body as a preview, ordered by `created_at desc`, limited to 1.
4. Render each match as a tappable card (mobile-first, brand-pink accent) linking to `app/messages/[matchId]/page.tsx`.
5. Wrap the list in a Framer Motion `motion.ul` so cards fade-and-rise in with `<AnimatePresence>` as data loads.

**Stretch:** add an index that makes the "latest message per match" lookup fast, and explain why your composite index helps.

This project forces you to traverse three tables (`matches` → `profiles` → `messages`) through foreign keys — exactly the relational thinking this chapter built.

---

## Key takeaways

- A relational database stores facts as **tables** of typed **rows** and **columns**, enforcing integrity the app can't be trusted to.
- **Primary keys** uniquely identify rows; **foreign keys** connect tables — together they turn lists into a navigable graph.
- The three shapes: **1:1** (shared/foreign key), **1:N** (FK on the many side), **N:M** (a join table).
- **Normalize** to store each fact once; denormalize only with evidence.
- **Indexes** make reads fast at a small write cost — index what you filter, join, and sort on.
- Viby's core is just six tables: `profiles`, `interests`/`profile_interests`, `swipes`, `matches`, `posts`, `messages`.

**Up next — Chapter 15: Supabase Row Level Security & Authorization**, where we lock these tables down so users can only ever read and write the rows they're allowed to.
