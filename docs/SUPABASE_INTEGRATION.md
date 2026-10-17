# Supabase integration — status & roadmap

The app runs in two modes via a single flag, [`lib/supabase/config.ts`](../lib/supabase/config.ts) →
`hasSupabase`. With env vars set it uses real Supabase; without them it falls back to the
Zustand demo store. Every feature below should keep that guard so the demo never breaks.

Enable connected mode:
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://YOUR.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```
Then run [`supabase/schema.sql`](../supabase/schema.sql) in the SQL editor, create a public
`photos` Storage bucket, and enable Email + Google auth providers.

---

## ✅ 1. Authentication (DONE)

| File | Role |
|---|---|
| `lib/supabase/{client,server}.ts` | Browser + server clients (`@supabase/ssr`) |
| `lib/supabase/config.ts` | `hasSupabase` mode flag |
| `proxy.ts` | Next 16 proxy (ex-middleware) — refreshes the session every request |
| `app/auth/callback/route.ts` | OAuth / magic-link code exchange |
| `app/actions/auth.ts` | `saveOnboarding()`, `signOut()` server actions |
| `app/login/page.tsx` | `signInWithOAuth('google')` + `signInWithOtp` + `verifyOtp` |
| `app/(app)/layout.tsx` | Protects the app; redirects to `/login` or `/onboarding` |

Persistent sessions (cookie-based via the proxy), protected routes, and onboarding
redirects all work. Test: set env vars → `/login` → Google or email code → onboarding → app.

---

## ✅ 2. Profiles + Storage (DONE)

| File | Role |
|---|---|
| `lib/supabase/storage.ts` | `uploadImage()` / `removeImageByUrl()` → public URLs in the `photos` bucket |
| `lib/queries/profiles.ts` | `mapProfileRow()`, `getProfileById()`, `getMyProfile()` (server reads) |
| `app/actions/profile.ts` | `saveProfile()` server action (persist + `revalidatePath`) |
| `lib/store.ts` → `updateMe()` | instant client cache update (demo + optimistic UI) |
| `components/profile/EditProfileSheet.tsx` | editable photos (real upload in connected mode), name, bio, city, interests, vibe |

Editing is wired to the profile **Edit** button and verified in demo mode (name/photo/interests
update live). In connected mode `saveProfile` persists and `uploadImage` pushes to Storage.
Onboarding already persists via `saveOnboarding` (auth milestone).

**Remaining for full connect:** make `app/(app)/u/[id]/page.tsx` an async Server Component that
calls `getProfileById` and passes the profile into the view (lands with Discover, since the
timeline/prompts read from `posts`/`profiles.prompts`).

## 3. Discover  →  candidates the user hasn't swiped, scored

```ts
const { data: swiped } = await supabase.from("swipes").select("target_id").eq("swiper_id", me);
const { data: people } = await supabase.from("profiles")
  .select("*").neq("id", me).not("id","in",`(${swiped.map(s=>s.target_id).join(",")})`).limit(30);
// rank with the existing compatibility() in lib/matching.ts
```
- Connect/skip persistence → insert into `swipes` (`save` | `pass`) from a server action.
- Mutual logic → after a `save`, check for the reciprocal row; if found, insert a `matches` row.

## 4. Connections  →  `matches` table

```ts
const { data } = await supabase.from("matches")
  .select("*, a:profiles!a_id(*), b:profiles!b_id(*)")
  .or(`a_id.eq.${me},b_id.eq.${me}`);
```
Render in `ConnectionsList`; realtime: subscribe to `matches` filtered to `me` for instant pop-in.

## 5. Chat (Realtime)  →  `conversations` / `messages`

```ts
// client component
const supabase = createClient();
useEffect(() => {
  const ch = supabase.channel(`conv:${id}`)
    .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        ({ new: m }) => append(m))
    .on("presence", { event: "sync" }, () => setOnline(ch.presenceState()))
    .subscribe((s) => s === "SUBSCRIBED" && ch.track({ typing: false }));
  return () => { supabase.removeChannel(ch); };
}, [id]);
```
- Send → `insert` into `messages` (optimistic UI already in the store pattern).
- Typing indicator → `channel.track({ typing: true })` + presence.
- Online status → presence join/leave.
- Unread → `conversation_members.last_read_at` vs latest message; update on open (`markRead`).

## 6. Activity feed  →  `posts` + `reactions` + `comments`, realtime INSERT

```ts
supabase.channel("feed")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, ({ new: p }) => prepend(p))
  .subscribe();
```
- Composer → upload image to Storage (below) → `insert` into `posts`.
- Reactions/comments → `insert`/`delete`; counts via `select ... count`.

## 7. Groups  →  `communities` + `community_members`

- Create → `insert` community (creator becomes member, `role='admin'`).
- Join/leave → `insert`/`delete` in `community_members`; `member_count` via a trigger or RPC.
- Group feed → `posts` filtered by a `community_id` column (add it) or a `community_posts` table.

## 8. Notifications  →  add a `notifications` table + realtime

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  type text,                 -- 'connection' | 'message' | 'comment' | 'reaction' | 'group_invite'
  actor_id uuid references profiles,
  entity_id uuid,
  read boolean default false,
  created_at timestamptz default now()
);
alter publication supabase_realtime add table notifications;
```
- Write rows from server actions (on match, message, comment, reaction, invite) or DB triggers.
- Client subscribes to `notifications` filtered to `user_id=eq.me` → toast + a bell badge.

---

## Storage (photos) — used by Profiles (#2) and Feed (#6)

```ts
const supabase = createClient();
const path = `${userId}/${crypto.randomUUID()}.jpg`;          // optimized, per-user path
await supabase.storage.from("photos").upload(path, file, { upsert: false });
const { data } = supabase.storage.from("photos").getPublicUrl(path);
// store data.publicUrl in profiles.photos[] / posts.image_url
```
Cleanup: when a post/photo is deleted, `supabase.storage.from("photos").remove([path])` in the
same server action (or a DB trigger → edge function).

---

### Build order recommendation
Auth ✅ → Profiles → Storage → Discover/Connections → Chat realtime → Feed → Groups → Notifications.
Each ships behind `hasSupabase`, so `main` always runs in demo mode too.
