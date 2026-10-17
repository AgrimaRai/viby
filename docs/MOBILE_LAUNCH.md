# Viby on Phone & Tablet — Logo, PWA, and App Stores

This is the practical path to run Viby on phones/tablets and publish to **Google Play** and the **Apple App Store**, keeping the single Next.js codebase.

## Strategy: Capacitor (recommended)
Wrap the deployed web app in a thin native shell → **one codebase → Android + iOS + Web**, 100% of the current UI preserved, native push/camera available. (A React Native/Expo rewrite would take months and throw away the existing UI — only worth it later if native UX becomes the core differentiator.)

```
Next.js app (Vercel)  ──►  PWA (installable today)
                      └──►  Capacitor shell  ──►  Google Play (.aab)
                                              └──►  App Store (.ipa)
```

## What's already done in this repo
- ✅ **Logo + full icon set** — `public/icon.svg`, `icon-maskable.svg`, `icon-192/512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`, and a **1024px store master** (`icon-1024.png`).
- ✅ **Installable PWA** — `app/manifest.ts` (name, icons, theme, standalone) + icons wired in `app/layout.tsx`.
- ✅ **Capacitor config** — `capacitor.config.ts` (just set your deployed URL).
- ✅ Phone-first responsive UI; centered app frame on larger screens.

## Cost & requirements
| | Google Play | Apple App Store |
|---|---|---|
| Account | **$25 once** | **$99 / year** |
| Build machine | Any OS + Android Studio | **macOS + Xcode** (required) |
| Review | hours–days | ~1–3 days, stricter |
| Output | `.aab` (App Bundle) | `.ipa` |

---

## Step 0 — Run on a phone *today* (no store needed)
Deploy (or `npm run dev` + your LAN IP / a tunnel like `ngrok`), open it in mobile Chrome/Safari → **Add to Home Screen**. It installs full-screen with the Viby icon. Great for testing and TestFlight-style sharing before stores.

## Step 1 — Deploy the web app
```bash
vercel --prod        # or push to GitHub → Vercel
```
Add your custom domain + HTTPS. Put that URL in `capacitor.config.ts → server.url`.

## Step 2 — Add Capacitor
```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm i -D @capacitor/assets
npx cap init Viby com.viby.app --web-dir public
npx cap add android
npx cap add ios            # macOS only
```

## Step 3 — Generate native icons & splash from our assets
```bash
# uses public/icon-1024.png (master) + maskable for adaptive icons
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' \
  --splashBackgroundColor '#ffffff' --android --ios
npx cap sync
```

## Step 4 — Native niceties (recommended for a social app)
- **Push:** `@capacitor/push-notifications` + Firebase (FCM) on Android, APNs on iOS — wire to the `notifications` table.
- **Status bar / splash:** `@capacitor/status-bar`, `@capacitor/splash-screen`.
- **Camera/photos:** `@capacitor/camera` for native profile/post uploads (falls back to web file input).
- **Deep links:** Android App Links + iOS Universal Links to your domain.

## Step 5 — Build & ship Android (Play)
```bash
npx cap open android      # opens Android Studio
# Build → Generate Signed App Bundle → create/keep your UPLOAD KEYSTORE (never lose it)
```
In **Play Console**: create the app, upload the `.aab`, complete the **Data Safety** form, age rating, store listing (icon = `icon-512.png`, feature graphic 1024×500, phone + 7" tablet screenshots), and the **Privacy Policy URL** + **account-deletion URL**. Release: **Internal testing → Closed beta → Production** (staged rollout).

## Step 6 — Build & ship iOS (App Store) — macOS
```bash
npx cap open ios          # opens Xcode
# Set signing team, bundle id com.viby.app → Product → Archive → Distribute App
```
In **App Store Connect**: create the app, upload via Xcode/Transporter, fill privacy nutrition labels, screenshots (6.7" + iPad), and submit for review. Use **TestFlight** for beta.

## Phone & Tablet support
- **Phone:** full-bleed, mobile-first (already optimized).
- **Tablet:** the app presents as a centered, comfortable column on a soft background (intentional, common for mobile-first apps). Provide **7" and 10" tablet screenshots** for Play. A *bespoke* two-pane tablet layout (list + detail) is a worthwhile **post-launch** enhancement, not a launch blocker.
- Test on real devices + emulators (Pixel + a tablet AVD; iPhone + iPad simulators).

## Re-generating icons
The PNGs were rendered from the SVGs with headless Chrome. To change the mark, edit `public/icon.svg` / `icon-maskable.svg` and re-render (see the project's icon render step), then re-run `npx @capacitor/assets generate`.

> Note: Capacitor deps and the native `android/`/`ios/` folders are **not** committed yet (they require the Android SDK / Xcode to build). Run the steps above on a machine with those toolchains.
