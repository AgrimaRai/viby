# Viby ✨

> Find your people. A premium social discovery & meetup platform — match on hobbies,
> share real-time activities, join communities, and meet people nearby who vibe like you.

Viby blends **hobby-based matching** (Hinge), **activity sharing** (Strava + BeReal),
and **community + meetups** (Discord/Reddit) in a soft, pastel, Apple-smooth interface.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

The MVP runs **fully on in-memory mock data** (no backend or keys required) so the
whole experience is clickable end-to-end. On desktop it renders inside a phone frame;
it's designed mobile-first.

### Flow to try
`/` landing → **Get started** → simulated Google / email-OTP login → **onboarding wizard**
(hobbies → profile → vibe → location → 🎉) → the app:

- **Discover** — swipe the deck: a soft lavender **✕** to skip, or the **spark** to open a
  Connect card with mutual-hobby highlights + icebreakers, write an intro, and **Send a Spark**
  (friendly, low-pressure — no dating-app heart anywhere).
- **Activity** — a persistent, Strava-meets-Instagram feed of real activity posts
  (image, caption, activity-type tag, location, timestamp); filter by activity type,
  tap **+** to share your own (with location), tap the spark to react.
- **Groups** — join/leave communities.
- **Events** — RSVP to meetups.
- **Chats** — open a match; messages send with a typing indicator + auto-reply.
- **Profile** — a lifestyle **activity timeline** (Pinterest-style masonry of your posts)
  plus interests, vibe, communities, and stats. Posts you share stay on your timeline.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Framer Motion · Zustand ·
TanStack Query · Supabase (`@supabase/ssr`) · deploy on Vercel.

## Wiring the real backend

1. Create a Supabase project, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor
   (tables, enums, RLS, realtime publication, signup trigger).
2. Copy `.env.example` → `.env.local` and fill the URL + anon key.
3. Swap the Zustand reads in `lib/store.ts` for queries against `lib/supabase/*` +
   TanStack Query / Supabase Realtime. The compatibility scoring in `lib/matching.ts`
   already matches the schema and is ready to run server-side.

## Architecture

Full product architecture, schema, design system, app structure, and matching logic:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
