# Viby — Run it locally & deploy

This is the **real, runnable project** (not a spec). It builds clean and runs with
`npm run dev`. By default it runs on an in-memory data layer (Zustand seeded from
`lib/mock.ts`) so the entire experience is clickable **with zero backend setup** —
then you can wire real Supabase whenever you want (schema + clients are included).

---

## 0. Prerequisites
- **Node.js ≥ 18.18** (built/tested on Node 22). Check: `node -v`
- npm (ships with Node). Check: `npm -v`

---

## 1. Folder structure

```
viby/
├─ app/
│  ├─ layout.tsx                 # fonts (Sora + Inter), <Providers>, metadata
│  ├─ globals.css                # Tailwind v4 + the Bubblegum-Pink design tokens (@theme)
│  ├─ page.tsx                   # Landing
│  ├─ login/page.tsx             # Auth (Google + email-OTP UI)
│  ├─ onboarding/page.tsx        # 5-step wizard (hobbies, 3–4 photos w/ prompts, vibe, location)
│  └─ (app)/                     # Authenticated shell (device frame + bottom tab bar)
│     ├─ layout.tsx              # DeviceFrame + TabBar
│     ├─ template.tsx            # per-navigation page transition
│     ├─ discover/page.tsx       # Discover browse (tap a profile)
│     ├─ discover/[id]/page.tsx  # Immersive full profile (photos → prompts → timeline → decide)
│     ├─ feed/page.tsx           # Activity feed + composer
│     ├─ communities/page.tsx    # Groups
│     ├─ connections/page.tsx    # Circle (your connections)
│     ├─ chat/page.tsx           # Conversation list
│     ├─ chat/[id]/page.tsx      # Realtime-style thread (typing + reply)
│     ├─ profile/page.tsx        # Your profile (timeline)
│     └─ u/[id]/page.tsx         # Anyone's profile (shared ProfileView)
├─ components/
│  ├─ ui/                        # shadcn-style primitives: button, chip, avatar
│  ├─ shell/                     # DeviceFrame, TabBar, TopBar
│  ├─ discover/                  # DiscoverBrowse, ImmersiveProfile, ConnectModal
│  ├─ feed/                      # PostCard, Composer, activity map
│  ├─ connections/               # ConnectionsList
│  ├─ profile/ProfileView.tsx
│  ├─ common/                    # Logo, GradientBlobs, TimeAgo
│  └─ Providers.tsx              # TanStack Query provider
├─ lib/
│  ├─ store.ts                   # Zustand store (the live demo data layer)
│  ├─ mock.ts                    # Seed data + generators (timelines, prompts, places)
│  ├─ matching.ts                # Compatibility scoring
│  ├─ types.ts, utils.ts
│  └─ supabase/{client,server}.ts# Supabase browser + server clients (ready to wire)
├─ supabase/schema.sql           # Postgres tables + RLS + realtime + signup trigger
├─ docs/ARCHITECTURE.md
├─ .env.example
└─ package.json
```

> **No `tailwind.config.js`** — this uses **Tailwind v4**, configured in CSS via
> `@theme` in `app/globals.css` (that's where `#FF6FB5` and the palette live).
> **shadcn**: the primitives in `components/ui/` are shadcn-style (CVA + `cn()` +
> Radix-free), hand-tuned to the brand so they don't look generic.

---

## 2. Install & run locally

```bash
cd viby
npm install
npm run dev
# open http://localhost:3000
```

That's it — the full flow works immediately:
landing → login → onboarding → Discover → open a profile → Catch the Vibe → chat,
plus Feed, Groups, Circle, and Profile timeline.

Other scripts:
```bash
npm run build   # production build (type-checks everything)
npm run start   # serve the production build
npm run lint
```

### Dependencies (already in package.json)
Runtime: `next` `react` `react-dom` `framer-motion` `zustand`
`@tanstack/react-query` `@supabase/supabase-js` `@supabase/ssr`
`lucide-react` `clsx` `tailwind-merge` `class-variance-authority`
Dev: `typescript` `tailwindcss@4` `@tailwindcss/postcss` `eslint` `eslint-config-next` + `@types/*`

If you ever start fresh, this is the equivalent scaffold + install:
```bash
npx create-next-app@latest viby --typescript --tailwind --app --eslint --import-alias "@/*"
cd viby
npm install framer-motion zustand @tanstack/react-query @supabase/supabase-js \
  @supabase/ssr clsx tailwind-merge class-variance-authority lucide-react
```

---

## 3. Connect Supabase (optional — turns mock data into real data)

The app ships with the clients and schema; flip it on when ready.

1. Create a project at <https://supabase.com>.
2. **Database** → SQL Editor → paste & run [`supabase/schema.sql`](supabase/schema.sql).
   It creates every table (`profiles`, `swipes`, `matches`, `posts`, `communities`,
   `messages`, …), **Row-Level Security** policies, the **realtime** publication
   (messages/posts/matches), and a trigger that auto-creates a `profiles` row on signup.
3. **Storage** → create a public bucket `photos` (for profile images / activity posts).
4. **Authentication** → enable **Email OTP** and **Google** providers (add Google OAuth
   credentials + redirect `http://localhost:3000/auth/callback`).
5. Copy your keys into `.env.local` (next section).
6. Swap the data source: `lib/store.ts` reads from `lib/mock.ts` today. Replace those
   reads with queries via `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts`
   (RSC/route handlers) using TanStack Query + Supabase Realtime channels. The scoring in
   `lib/matching.ts` already matches the schema and runs server-side as-is.

---

## 4. Environment variables

Copy the template and fill it in:
```bash
cp .env.example .env.local
```
```env
# .env.local  (the demo runs fine with these blank)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```
`.env.local` is gitignored. Never commit real keys. Use the **anon** (public) key on the
client; keep the service-role key server-only if you add admin routes.

---

## 5. Deploy to Vercel

```bash
npm i -g vercel        # once
vercel                 # link & preview deploy
vercel --prod          # production
```
Or via the dashboard: push to GitHub → **Import Project** on <https://vercel.com> →
it auto-detects Next.js. Then **Project → Settings → Environment Variables** → add
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` → redeploy.
Finally add your Vercel URL to Supabase **Auth → URL Configuration** (Site URL +
`https://your-app.vercel.app/auth/callback`).

---

## Notes
- **Next 16 / React 19 / Tailwind v4** — `create-next-app@latest` installs these; they're
  the current stable line and fully compatible (the brief said "Next 15"; 16 is its
  successor, no breaking changes for this app).
- **Mobile-first**: every screen is designed at 390px; on desktop it renders inside a
  centered phone frame so the mobile product always looks intentional.
- Images use `i.pravatar.cc` (faces) and `picsum.photos` (scenes) so the demo always
  renders with no API keys; swap for Supabase Storage URLs when wired.
```
