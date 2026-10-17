# Viby — Product Architecture & Build Plan

> **Viby** is a premium social discovery & meetup platform. It blends hobby-based matching (Hinge), real-time activity sharing (Strava + BeReal), community interaction (Discord/Reddit), and a soft pastel aesthetic (Pinterest/Airbnb/Apple).
>
> **Positioning:** *Not a dating app.* Viby helps people make friends, find activity partners, discover communities, and socialize through shared hobbies & lifestyles.

---

## 1. Full Product Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js 15)                    │
│  App Router · RSC · TypeScript · Tailwind v4 · shadcn/ui        │
│  Framer Motion · Zustand (UI state) · TanStack Query (server)   │
├──────────────────────────────────────────────────────────────┤
│   Onboarding │ Discover │ Feed │ Communities │ Events │ Chat    │
│              │ (swipe)  │      │             │        │         │
├──────────────────────────────────────────────────────────────┤
│                    Data / Service Layer                         │
│  lib/supabase (browser+server clients) · lib/queries · matching │
├──────────────────────────────────────────────────────────────┤
│                        SUPABASE                                 │
│  Auth (Google OAuth + Email OTP) · Postgres + RLS               │
│  Realtime (chat, presence, feed) · Storage (photos)             │
│  Edge Functions (compatibility scoring, notifications)          │
└──────────────────────────────────────────────────────────────┘
                          Deployed on Vercel
```

**Key architectural decisions**
- **Mobile-first**: every screen designed at 390px first, scaled up to a centered "device frame" on desktop.
- **Server Components by default**; client components only where interaction/animation lives (swipe deck, chat, motion).
- **Zustand** for ephemeral UI state (active tab, swipe stack, onboarding wizard). **TanStack Query** for server cache + realtime sync.
- **RLS everywhere** — every table is row-level-secured to the authenticated user.
- **Optimistic UI** for swipes, reactions, RSVPs — instant feel, reconcile in background.

---

## 2. Feature Structure (MVP)

| Domain | Feature | Status |
|---|---|---|
| **Auth** | Google OAuth, Email OTP | MVP |
| **Profile** | Photos, bio, interests, hobbies, vibe tags, location, lifestyle | MVP |
| **Onboarding** | Hobby picker → profile setup → vibe/personality → location | MVP |
| **Discover** | Swipe deck, interest-based ranking, save/pass | MVP |
| **Matching** | Mutual match, compatibility %, hobby overlap | MVP |
| **Feed** | Activity posts (image, caption, activity tag, timestamp), reactions, comments | MVP |
| **Chat** | 1:1 realtime messaging, typing indicator, read state | MVP |
| **Communities** | Create/join, community feed | MVP |
| **Events** | Create meetup, RSVP, attendee list | MVP |
| Recommendations | "People near you", trending activities | MVP-lite |
| Video calling, AI rec, monetization, moderation | — | Deferred |

---

## 3. User Flow

```
Launch
  └─ Splash (animated logo)
       └─ Auth (Google / Email OTP)
            ├─ New user → Onboarding
            │     1. Welcome
            │     2. Pick hobbies (min 3)
            │     3. Profile (name, photos, bio)
            │     4. Vibe & personality tags
            │     5. Location + radius
            │     6. "You're in" celebration → Discover
            └─ Returning user → Discover (home)

Main app (bottom tab bar):
  Discover ─ swipe cards → match modal → Chat
  Feed     ─ scroll posts → react/comment → post composer
  Communities ─ browse/join → community feed → create
  Events   ─ browse/RSVP → event detail → create meetup
  Profile  ─ view/edit self, see matches, settings
  Chat     ─ conversation list → thread (realtime + typing)
```

---

## 4. Database Schema (Postgres / Supabase)

```sql
-- ── Profiles ─────────────────────────────────────────────
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text unique not null,
  display_name  text not null,
  bio           text,
  avatar_url    text,
  photos        text[] default '{}',
  vibe_tags     text[] default '{}',          -- e.g. {calm, adventurous, creative}
  lifestyle     jsonb default '{}',           -- {sleep:"early", work:"founder", ...}
  city          text,
  lat           double precision,
  lng           double precision,
  radius_km     int default 25,
  onboarded     boolean default false,
  created_at    timestamptz default now()
);

-- ── Interests / Hobbies (taxonomy + join) ────────────────
create table interests (
  id     serial primary key,
  slug   text unique not null,                -- "coffee", "gym", "photography"
  label  text not null,
  emoji  text,
  category text                                -- fitness, arts, social, outdoors...
);

create table profile_interests (
  profile_id uuid references profiles on delete cascade,
  interest_id int references interests on delete cascade,
  weight     int default 1,                    -- how much they love it (1-3)
  primary key (profile_id, interest_id)
);

-- ── Discovery / Swipes / Matches ─────────────────────────
create type swipe_dir as enum ('save','pass');

create table swipes (
  id          uuid primary key default gen_random_uuid(),
  swiper_id   uuid references profiles on delete cascade,
  target_id   uuid references profiles on delete cascade,
  direction   swipe_dir not null,
  created_at  timestamptz default now(),
  unique (swiper_id, target_id)
);

create table matches (
  id          uuid primary key default gen_random_uuid(),
  a_id        uuid references profiles on delete cascade,
  b_id        uuid references profiles on delete cascade,
  compatibility int,                            -- 0-100 cached score
  created_at  timestamptz default now(),
  unique (a_id, b_id)
);

-- ── Activity Feed ────────────────────────────────────────
create table posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references profiles on delete cascade,
  caption     text,
  image_url   text,
  activity_tag text,                            -- "gym","cafe","run","reading"...
  created_at  timestamptz default now()
);

create table reactions (
  post_id    uuid references posts on delete cascade,
  profile_id uuid references profiles on delete cascade,
  emoji      text default '💜',
  primary key (post_id, profile_id)
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references posts on delete cascade,
  author_id  uuid references profiles on delete cascade,
  body       text not null,
  created_at timestamptz default now()
);

-- ── Communities ──────────────────────────────────────────
create table communities (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  cover_url   text,
  emoji       text,
  member_count int default 0,
  created_by  uuid references profiles,
  created_at  timestamptz default now()
);

create table community_members (
  community_id uuid references communities on delete cascade,
  profile_id   uuid references profiles on delete cascade,
  role         text default 'member',
  joined_at    timestamptz default now(),
  primary key (community_id, profile_id)
);

-- ── Events / Meetups ─────────────────────────────────────
create table events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  cover_url    text,
  activity_tag text,
  location     text,
  starts_at    timestamptz not null,
  host_id      uuid references profiles,
  community_id uuid references communities,
  capacity     int,
  created_at   timestamptz default now()
);

create type rsvp_status as enum ('going','interested','cant');
create table event_rsvps (
  event_id   uuid references events on delete cascade,
  profile_id uuid references profiles on delete cascade,
  status     rsvp_status default 'going',
  primary key (event_id, profile_id)
);

-- ── Chat ─────────────────────────────────────────────────
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid references matches on delete set null,
  created_at timestamptz default now()
);

create table conversation_members (
  conversation_id uuid references conversations on delete cascade,
  profile_id      uuid references profiles on delete cascade,
  last_read_at    timestamptz,
  primary key (conversation_id, profile_id)
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade,
  sender_id       uuid references profiles on delete cascade,
  body            text not null,
  created_at      timestamptz default now()
);

-- Realtime channels: messages (per conversation), typing presence,
-- posts (global feed insert), matches (per user).
-- RLS: profiles readable by all authed; writes self-only.
-- swipes/matches/messages scoped to participants.
```

---

## 5. Design System — "Soft Lilac"

**Color tokens** (HSL, exposed as Tailwind v4 `@theme` vars)
```
--cream      #FBF8FF   page background
--lavender   #C9B8FF   primary
--lavender-2 #A88FF5   primary deep (text on cream)
--blush      #FFC9DE   accent / hearts
--powder     #B8D8FF   info / calm
--lilac      #E9DEFF   surface tint
--ink        #2E2A3A   primary text (never pure black)
--ink-soft   #6B6580   secondary text
--glass      rgba(255,255,255,0.55) + 18px blur
```
**Signature gradient:** `linear-gradient(135deg, #E9DEFF 0%, #FFE3EF 45%, #DCEBFF 100%)`

**Typography**
- Display / headings: **Clash Display** or `"Cabinet Grotesk"` (fallback `Sora`) — friendly geometric.
- Body / UI: **Inter** / `Geist` — clean, neutral.
- Scale: 12 / 14 / 16 / 20 / 28 / 40, line-height airy (1.5 body, 1.15 display).

**Shape & elevation**
- Radii: cards `28px`, chips `999px`, sheets `32px` top corners.
- Shadows: soft, colored — `0 20px 60px -20px rgba(168,143,245,.45)` (no harsh greys).
- Glass: subtle, only on nav bar + modals (`backdrop-blur` + 55% white + hairline border).

**Motion language** (Framer Motion)
- Page transitions: fade + 8px rise, `ease:[0.22,1,0.36,1]`, 0.4s.
- Swipe: spring `{stiffness:300,damping:30}`, rotate ±12°, fly-off on threshold.
- Cards/chips: hover lift `y:-2 scale:1.02`, tap `scale:0.97`.
- Loading: shimmer skeletons + breathing logo, never spinners.
- Match reveal: confetti-free, soft scale-in + glow pulse.

**Components (shadcn, restyled):** Button, Card, Avatar, Badge/Chip, Dialog/Sheet, Tabs, Input, Textarea, Skeleton, Toast.

---

## 6. App Structure (file tree)

```
viby/
├─ app/
│  ├─ layout.tsx                 # fonts, theme, device frame
│  ├─ page.tsx                   # splash → redirect
│  ├─ (auth)/
│  │   ├─ login/page.tsx
│  │   └─ callback/route.ts
│  ├─ onboarding/page.tsx        # multi-step wizard
│  ├─ (app)/
│  │   ├─ layout.tsx             # bottom tab bar + transitions
│  │   ├─ discover/page.tsx      # swipe deck
│  │   ├─ feed/page.tsx          # activity feed + composer
│  │   ├─ communities/page.tsx
│  │   ├─ events/page.tsx
│  │   ├─ chat/page.tsx          # conversation list
│  │   ├─ chat/[id]/page.tsx     # thread
│  │   └─ profile/page.tsx
├─ components/
│  ├─ ui/                        # shadcn primitives (restyled)
│  ├─ discover/SwipeDeck.tsx, ProfileCard.tsx, MatchModal.tsx
│  ├─ feed/PostCard.tsx, Composer.tsx, ReactionBar.tsx
│  ├─ shell/TabBar.tsx, TopBar.tsx, DeviceFrame.tsx
│  └─ common/Chip.tsx, GradientBlob.tsx, Skeletons.tsx
├─ lib/
│  ├─ supabase/{client,server}.ts
│  ├─ matching.ts                # compatibility scoring
│  ├─ mock.ts                    # seed data for demo
│  └─ store.ts                   # Zustand
├─ supabase/schema.sql
└─ docs/ARCHITECTURE.md          # this file
```

---

## 7. Core Matching Logic

Compatibility is a weighted blend, normalized to **0–100**:

```ts
score =
    0.40 * hobbyOverlap        // Jaccard on weighted interests
  + 0.20 * vibeAffinity        // cosine on vibe_tags vector
  + 0.15 * lifestyleMatch      // categorical agreement (sleep, work, social)
  + 0.15 * proximity           // 1 - (distance / maxRadius), clamped
  + 0.10 * communityOverlap    // shared communities (Jaccard)
```

- **hobbyOverlap** = Σ(min weights of shared interests) / Σ(max weights of union) — rewards *intense* shared passions, not just count.
- **vibeAffinity** = cosine similarity over a fixed vibe vocabulary vector.
- **proximity** = haversine distance vs. each user's radius preference (mutual min).
- Discovery feed = candidates not yet swiped, ranked by score DESC with light **freshness jitter** so the deck never feels static.
- A **match** is created when both users `save` each other; compatibility is cached on the match row and surfaced in the match modal + chat header.

> See `lib/matching.ts` for the reference implementation used in the demo (runs on mock data; same function will run server-side / in an edge function against real rows).

---

*Next: scaffold the Next.js project, install the design system, and build the MVP screens with mock data wired for Supabase.*
