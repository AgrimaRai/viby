# Viby — Production Readiness & Launch Plan

> Prepared as CTO / PM / Security / Mobile-architect review of the current codebase.
> **Bottom line:** Viby is a beautifully designed, demo-complete **frontend prototype** with a real **auth + profile** foundation, but its social core still runs on **in-memory mock data**, and trust & safety, infrastructure, legal, and mobile packaging do **not exist yet**. It is *demo-ready*, not *launch-ready*.

---

## 0. Launch Readiness Score — **34 / 100**

| Area | Score | Notes |
|---|---|---|
| UI / UX polish | 90 | Genuinely premium, consistent design system, mobile-first |
| Frontend architecture | 80 | Next.js 16 App Router, clean components, typed |
| Authentication | 55 | Real Supabase auth wired + env-guarded, **never tested against a live project** |
| Core data (discover, feed, chat, groups, connections) | 12 | **Mock/Zustand only** — not wired to the database |
| Realtime (chat, presence, notifications) | 8 | Simulated; no Supabase Realtime in use; **no notifications system** |
| Trust & Safety (report, block, moderation, anti-abuse) | 0 | **None.** Hard blocker for a public social app |
| Security hardening (RLS validated, rate limits, validation) | 15 | RLS written but unverified; no rate limiting; no server-side validation |
| Infra / scaling / observability | 5 | No monitoring, logging, analytics, or error tracking |
| Legal / compliance | 20 | Templates now provided (this plan); none published or wired |
| Mobile / Play Store packaging | 0 | It's a web app; no Android package, icons, or store assets |
| Testing / QA | 0 | No automated tests |

**Interpretation:** ~70% of "launch" is the invisible 30% — data wiring, safety, infra, legal, and packaging. The visible product is excellent; the launchable product needs the systems beneath it.

---

## 1. Codebase Audit

### ✅ A. Already production-quality
- Full design system (bubblegum-pink tokens, Tailwind v4 `@theme`), responsive mobile-first layouts.
- All primary screens built & polished: landing, login, onboarding (with mandatory photos + prompts), Discover browse → immersive profile, activity feed, groups, connections (Circle), chat list + thread, profile + edit, signature non-circular identity system.
- Next.js 16 App Router structure, server/client split, route groups, `proxy.ts` session refresh, protected `(app)` layout.
- Auth UX (Google + email-OTP), onboarding wizard, edit-profile sheet, connect/skip flow, animations.
- A real `supabase/schema.sql` (tables + RLS + realtime publication + signup trigger).

### 🟡 B. MVP / mock (works in demo, NOT real)
- **Discover, Feed, Chat, Communities, Connections all read `lib/store.ts` (Zustand) seeded from `lib/mock.ts`** — not the database.
- Auth + profile read/write Supabase **but have never run against a live project**.
- Storage upload helper + queries exist but are unexercised.
- Matching score runs client-side on mock profiles.
- Images are `pravatar`/`picsum` placeholders, not user uploads.

### 🔴 C. Must complete before launch (does not exist)
- Wire **all** social features to Supabase (discover candidates, swipes/matches, feed, chat realtime, groups, notifications).
- **Trust & safety:** reporting, blocking, moderation queue, anti-spam, fake-account prevention.
- **Security hardening:** verify RLS end-to-end, server-side input validation, rate limiting, image-upload scanning, secure file paths.
- **Notifications** system (in-app + push).
- **Legal:** published Privacy Policy, ToS, Community Guidelines, data-deletion endpoint.
- **Observability:** error tracking, logging, product analytics, uptime monitoring.
- **Mobile packaging** for Play Store (TWA/Capacitor) + store assets.
- **Account lifecycle:** email verification states, password-less recovery, account deletion (Play + GDPR requirement).

### ⏭️ D. Can wait until after launch
- Advanced matching/ranking (ML, embeddings), recommendation tuning.
- Events feature (was removed from nav).
- Group voice/video, advanced admin tooling.
- Monetization/subscriptions (build the funnel first).
- i18n / localization, deep analytics dashboards, A/B testing infra.
- Tablet-optimized layouts (ship phone-first).

---

## 2. Mobile App Strategy — recommendation

You do **not** need to rewrite Viby to ship to the Play Store.

### Option A — Responsive Next.js web app (+ wrap for Play Store)
Ship the existing app to the web, make it an installable **PWA**, then publish to Play Store via **TWA (Trusted Web Activity)** or **Capacitor**.

| | TWA (Bubblewrap / PWABuilder) | Capacitor |
|---|---|---|
| What it is | Chrome renders your live PWA full-screen inside an Android shell | Native shell with a WebView pointing at your app + native plugin bridge |
| Speed to store | **Days** | ~1–2 weeks |
| Native APIs (push, camera, contacts) | Limited (web APIs only) | **Full** (FCM push, camera, biometrics, etc.) |
| Push notifications | Web Push only (clunky on Android) | **Native FCM** ✅ |
| Best for | Fastest possible launch | Social app that needs real push + native feel |

**Pros of Option A:** keeps 100% of the polished UI you've built; one codebase; fastest/cheapest; web + Android from day one.
**Cons:** WebView feel (mitigated with good PWA + Capacitor), depends on connectivity, some native niceties need plugins.

### Option B — React Native / Expo rewrite
**Pros:** best-in-class native UX, gestures, performance, offline, App Store + Play Store native.
**Cons:** **full rewrite** of every screen/animation (months), new skill surface, duplicated logic, throws away the current web investment, slower/costlier to launch.

### ✅ Recommendation
**Launch with Option A using Capacitor** (web app on Vercel + Capacitor Android shell for Play Store + FCM push). It preserves your entire UI, gets you to the store in ~2 weeks, and supports the push notifications a social app needs. Revisit **React Native/Expo only if/when** native UX becomes a core differentiator and you have traction to justify the rewrite. Keep the web app the source of truth either way.

---

## 3. Google Play Store requirements

**Account & signing**
- Google Play Developer account — **one-time $25**, identity + (for individuals) D-U-N-S not required but address/ID verification is.
- **App signing by Google Play** (upload key + Play-managed signing key). Generate an upload keystore; never lose it.
- `applicationId` (e.g., `com.viby.app`), `versionCode`/`versionName`, target the **latest required `targetSdk`** (Play enforces a recent API level).

**Package (Capacitor/TWA)**
- Android App Bundle (`.aab`), 64-bit, adaptive **app icon** (foreground+background), splash screen.
- For TWA: **Digital Asset Links** (`/.well-known/assetlinks.json`) on your domain to verify ownership and hide the URL bar.
- HTTPS everywhere (Vercel gives this), valid PWA manifest + service worker (for TWA).

**Store listing assets**
- App icon **512×512** PNG.
- **Feature graphic 1024×500**.
- Phone **screenshots** (min 2; ideally 4–8, 1080×1920-ish) — use real polished screens.
- Short description (≤80 chars) + full description (≤4000).
- App category (Social), contact email, **Privacy Policy URL** (required).

**Policy / compliance (these gate approval for a social app)**
- **Data safety form** — declare exactly what you collect (email, photos, location, messages), why, sharing, and security. Must match your Privacy Policy.
- **Account deletion** — Play *requires* an in-app and web path to request account + data deletion.
- **User-generated content policy** — you must have: a content policy, **in-app reporting**, **blocking**, and a method to remove violating content + users. Social apps are reviewed strictly here.
- **Age rating** via the content questionnaire. Decide minimum age (recommend **18+** to avoid minor-safety obligations, or 16+ with strict safeguards) and enforce a **date-of-birth gate** at signup.
- Permissions justified (camera/photos for profile uploads, notifications).

---

## 4. Security Audit & implementation steps

> Priority order: anything that lets a stranger read others' data, spam users, or upload malware is a **launch blocker**.

1. **Authentication**
   - Use Supabase Auth (already wired). Enforce email verification; set session/JWT expiry + refresh (proxy.ts handles refresh).
   - Add a **date-of-birth / age gate** and store `birthdate`; block under-age signups.
   - Rate-limit auth endpoints (OTP requests) — Supabase has built-in limits; add your own per-IP throttle.

2. **Database security & RLS** *(highest priority)*
   - The RLS in `schema.sql` is written but **unverified**. Before launch: write a test matrix — for each table, attempt read/write as (a) anon, (b) other user, (c) owner — and confirm only the intended access succeeds. RLS is your real authorization layer; never trust the client.
   - Add policies for every new table (notifications, reports, blocks). Default-deny.

3. **API protection & rate limiting**
   - Wrap Server Actions / route handlers with rate limiting (e.g., Upstash Redis ratelimit) keyed by user/IP: messages, posts, swipes, reports, uploads.
   - Validate **all** inputs server-side with a schema validator (e.g., Zod) — never rely on client validation.

4. **Spam / fake-account / abuse prevention**
   - Email verification + (optionally) phone or OAuth-only to raise the cost of fake accounts.
   - Bot protection on signup (Turnstile/hCaptcha).
   - Velocity limits: max connections/messages/posts per hour for new accounts; shadow-throttle suspected spam.
   - Duplicate-image / disposable-email checks.

5. **Image upload security**
   - Restrict bucket to authenticated users; **per-user paths** (already in `storage.ts`); validate MIME + size client and server side; strip EXIF/GPS; cap dimensions.
   - **Moderation:** run uploaded images through a moderation API (e.g., a vision moderation service) before they're public; quarantine on upload.

6. **Chat security**
   - RLS so only conversation members can read/insert messages (in schema — verify).
   - Rate-limit sends; basic profanity/abuse filtering; allow reporting a message; no PII leakage in payloads.

7. **Reporting system** *(blocker)*
   - `reports` table (`reporter_id`, `target_type`, `target_id`, `reason`, `status`). In-app "Report" on profiles, posts, messages, groups. Notify a moderation queue.

8. **Blocking system** *(blocker)*
   - `blocks` table (`blocker_id`, `blocked_id`). Filter blocked users out of Discover, feed, chat, search **in queries and RLS**. Blocking must be mutual-invisibility.

9. **Secrets & transport** — only `NEXT_PUBLIC_*` on the client; service-role key server-only; HTTPS only; security headers (CSP, HSTS) via `next.config`/Vercel.

---

## 5. Scalability roadmap

Supabase + Vercel scales a long way before you touch anything. Plan by stage:

**0 → 100 users (private beta)**
- Supabase **Free/Pro**, single region near your users. Vercel Hobby/Pro.
- Add error tracking (Sentry) + product analytics (PostHog) + uptime check **now** — you want data from user #1.
- Manual moderation is fine.

**100 → 1,000**
- Supabase **Pro**; add DB **indexes** on hot paths (swipes by swiper, messages by conversation+time, posts by created_at). Enable PITR backups.
- Add **caching** for read-heavy, slow-changing data (interests, community lists) via Next.js caching / `revalidate`.
- Introduce **rate limiting** (Upstash) and a basic moderation dashboard.
- Storage: enable Supabase CDN / image transforms; lazy-load + responsive images.

**1,000 → 10,000**
- Watch DB connections — use **connection pooling (Supavisor/PgBouncer)**; move heavy reads to read replicas if needed.
- Offload the matching/feed ranking to **edge functions / background jobs**; precompute candidate pools.
- Realtime: shard channels per conversation; monitor concurrent connections (Supabase realtime quotas).
- CDN images aggressively; add a queue for moderation + notifications.
- Cost & query monitoring dashboards; alerting on p95 latency + error rate.

**10,000 → 100,000**
- Dedicated Supabase compute tier / consider self-hosted Postgres + Supabase services, or sharding by region.
- Move notifications + image processing + ranking to dedicated workers / a queue (e.g., QStash, SQS).
- Multi-region read replicas + edge caching; CDN for everything static.
- Formal on-call, SLOs, load testing, and a data-retention/cleanup strategy.
- Trust & safety scales to a **team + tooling** (automated classifiers + human review).

Cross-cutting (add early, scales with you): **Sentry** (errors), **PostHog/GA4** (product analytics + funnels), **structured logging**, **uptime/synthetic monitoring**, **Supabase logs & query insights**.

---

## 6. User-experience requirements before launch
- **Onboarding & profile completion:** enforce min 3 photos + bio + ≥3 interests (already in UI); add a "complete your profile" nudge + completion meter; gate Discover until complete.
- **Notifications:** in-app center + push (new connection, message, reaction, comment, group activity). Settings to toggle.
- **Empty states:** real ones for no matches, no messages, no posts, no connections, no search results (partly done — verify all).
- **Loading states:** skeletons for every async screen (some exist; add for DB-backed lists); optimistic UI for swipes/messages/reactions.
- **Error handling:** global error boundary, friendly retry UI, offline banner, toast on action failure.
- **Accessibility:** color-contrast pass (pink-on-white text needs AA checking), focus states, alt text on images, semantic landmarks, screen-reader labels on icon buttons, respect reduced-motion.
- **Responsiveness:** phone-first is solid; add tablet breakpoints post-launch.

---

## 7. Legal requirements
Templates generated in **`/legal`** (replace bracketed placeholders, then have a lawyer review before publishing — these are starting points, not legal advice):
- [`legal/privacy-policy.md`](../legal/privacy-policy.md)
- [`legal/terms-of-service.md`](../legal/terms-of-service.md)
- [`legal/community-guidelines.md`](../legal/community-guidelines.md)
- [`legal/content-policy.md`](../legal/content-policy.md)
- [`legal/data-deletion-policy.md`](../legal/data-deletion-policy.md)
- [`legal/user-reporting-policy.md`](../legal/user-reporting-policy.md)

Wire-up: host them at `/legal/*` routes, link from onboarding (consent checkbox), settings, and the Play listing; implement the **account + data deletion** flow they promise (Play + GDPR/CCPA requirement).

---

## 8. Monetization roadmap (don't harm UX)
Build the audience first; introduce gently.
- **Free tier (always generous):** core discovery, connections, chat, feed, groups. Trust is the product.
- **Viby+ (premium subscription, ~$8–12/mo):** see who connected with you, advanced filters (interests/vibe/distance), unlimited daily connects, profile boost, premium themes/identity frames, read receipts. Sell *delight & reach*, never safety.
- **Non-subscription:** one-off **Boosts** (surface your profile for 30 min), event/community creation perks.
- **Later:** local partnerships (cafés/venues for meetups), verified-creator/community tiers, sponsored communities (clearly labeled). **Never** sell user data or paywall safety features (reporting/blocking always free).
- Use **Google Play Billing** for in-app purchases on Android (Play requires it for digital goods) — factor the 15–30% cut.

---

## 9. Final roadmap

### 🚧 Critical blockers (cannot launch without)
1. Wire the social core to Supabase (discover, swipes/matches, feed, chat realtime, groups) — today it's mock.
2. Validate auth + RLS against a live project (currently untested).
3. **Reporting + blocking + content moderation** (UGC policy requirement).
4. **Account & data deletion** flow (Play + GDPR).
5. Server-side validation + rate limiting + image moderation.
6. Published Privacy Policy / ToS / Community Guidelines.
7. Mobile package (Capacitor) + Play data-safety form + age gate.

### 🔴 High priority
- Notifications (in-app + FCM push), error tracking + analytics, image upload hardening, security headers, real images replacing placeholders, full empty/loading/error states, accessibility pass.

### 🟠 Medium priority
- Moderation dashboard, rate-limit tuning, caching + indexes, onboarding completion meter, settings (notifications/privacy/blocked list), search.

### 🟢 Nice-to-have (post-launch)
- Monetization, tablet layouts, i18n, advanced ranking/recommendations, events, group calls, A/B testing.

### ⏱️ Estimated timeline to launch (1–2 focused engineers)
- **Weeks 1–3:** wire social core to Supabase + validate auth/RLS live.
- **Weeks 3–5:** trust & safety (report/block/moderation), validation, rate limiting, image moderation, account deletion.
- **Weeks 5–6:** notifications, analytics/Sentry, security headers, empty/loading/error/accessibility polish.
- **Weeks 6–7:** Capacitor Android build, store assets, data-safety form, legal pages live, age gate.
- **Week 8:** closed beta (Play internal testing), bug-bash, then production rollout (staged %).
- **Realistic: ~6–8 weeks** to a safe public launch; ~3–4 weeks for an *invite-only closed beta* if you cut groups/notifications.

### 🪜 Step-by-step: current project → Play Store
1. Create the Supabase project; run `supabase/schema.sql`; set `.env.local`; **verify auth + RLS live**.
2. Replace mock reads in Discover/Feed/Chat/Connections/Groups with real queries + Realtime (the seam already exists via `hasSupabase`).
3. Add `reports`, `blocks`, `notifications` tables (+ RLS) and the UI (report/block buttons, notification center).
4. Add Zod validation + Upstash rate limiting to all Server Actions; harden Storage uploads + image moderation.
5. Add age gate + account-deletion flow; publish legal pages; add consent at onboarding.
6. Add Sentry + PostHog + uptime monitoring; security headers in `next.config`.
7. Deploy to Vercel (prod env); attach a custom domain + HTTPS.
8. Add a PWA manifest + service worker; wrap with **Capacitor** (Android), wire **FCM** push, build the `.aab`.
9. Create Play Developer account; upload key + Play signing; fill **data-safety form**, age rating, store listing (icon, feature graphic, screenshots, descriptions, Privacy URL).
10. Ship to **Internal testing → Closed beta → Open/Production** (staged rollout). Watch dashboards; iterate.

---

*This plan reflects the codebase as audited. The fastest credible path is: make the data real → make it safe → wrap it for Android → launch a closed beta, then widen.*
