# Chapter 20 — The Onboarding Flow

> First impressions are everything — and in Viby, onboarding *is* the product. A delightful five-minute wizard turns a stranger into someone your community wants to meet.

So far you've built auth, a database, and a profile schema. But a brand-new Viby account is a ghost: no hobbies, no photos, no vibe. Nobody discovers a ghost. In this chapter we build the **onboarding wizard** — the joyful, animated, friction-light flow that takes a freshly-signed-up user and turns them into a discoverable human being.

## What you'll learn

- How to model a **multi-step wizard** as a single client component with a state machine, not five separate pages.
- Driving smooth **enter/exit step transitions** with Framer Motion's `AnimatePresence` and a directional slide.
- Building a **progress bar** that animates as the user advances.
- Collecting **hobbies, 3–4 prompt-based photos, a vibe, and location**, with per-step **validation** that blocks bad data without nagging.
- Uploading images to **Supabase Storage** and persisting everything atomically through a `saveOnboarding` **Server Action**.
- Redirecting completed users away from onboarding using `proxy.ts`.

## Prerequisites

- **Chapter 8** — Tailwind v4 theme tokens (`@theme`) and the Viby color system.
- **Chapter 12** — Zustand stores for ephemeral, in-memory UI state.
- **Chapter 15** — Supabase Auth with `@supabase/ssr` (`createBrowserClient` / `createServerClient`).
- **Chapter 17** — Server Actions and the `"use server"` directive.
- **Chapter 18** — the `profiles` table and Row Level Security.

---

## Theory

### A wizard is a state machine, not a stack of pages

The naive instinct is to make each step its own route: `/onboarding/hobbies`, `/onboarding/photos`, and so on. Resist it. The moment you split steps across routes, you lose the half-filled form on every navigation, you can't animate between steps, and "go back" becomes a browser-history minefield.

Think of the wizard like a **photo carousel inside a single frame**. The frame (the card, the progress bar, the Next button) never moves. Only the *slide* inside it changes. That mental model maps perfectly to React: one client component owns a `step` index and a single `data` object; each step is just a different child rendered into the same frame.

This gives us three superpowers:

1. **State survives** as the user moves back and forth — it lives in one place.
2. **We can animate** the swap, because the old slide and the new slide briefly coexist.
3. **Validation is local** — each step says "am I valid?" and the frame decides whether Next is allowed.

### Why AnimatePresence

React normally unmounts a component the instant it leaves the tree — there's no time to play an exit animation. `AnimatePresence` is Framer Motion's answer: it *keeps a leaving element mounted* just long enough to run its `exit` animation, then removes it. For a wizard, that means the outgoing step can slide left while the incoming step slides in from the right. The analogy: AnimatePresence is a stage manager who lets an actor finish their exit line before pulling the curtain.

### Prompt-based photos, not a dump

Viby is social *discovery*, not a dating clone, and our photo step reflects that. Instead of "upload 6 selfies," we use **prompts** — "A hobby in action," "Your happy place," "Caught laughing." Prompts produce richer, more honest profiles and give us captions for free. We require **3 to 4** filled prompts: enough to feel like a person, few enough to finish in a sitting.

### Persist once, at the end

We hold everything in client state and commit it in a **single Server Action** at the finish line. Why not save per-step? Because a half-onboarded profile is worse than no profile — it shows up in discovery looking broken. One atomic `saveOnboarding` keeps the database honest: a profile is either fully onboarded or not at all.

---

## In practice

### 1. The wizard state, in Zustand

We keep the in-progress answers in a Zustand store so any step can read and write without prop-drilling. This is ephemeral demo state (Chapter 12) — the source of truth becomes the database only after `saveOnboarding`.

```ts
// stores/use-onboarding.ts
import { create } from "zustand";

export type Vibe = "chill" | "adventurous" | "creative" | "social" | "nerdy";

export interface PromptPhoto {
  prompt: string;
  /** Object URL for preview; the File is what we upload. */
  file: File | null;
  previewUrl: string | null;
}

export interface OnboardingData {
  hobbies: string[];
  photos: PromptPhoto[];
  vibe: Vibe | null;
  location: { city: string; lat: number | null; lng: number | null };
}

interface OnboardingState extends OnboardingData {
  setHobbies: (hobbies: string[]) => void;
  setPhoto: (index: number, file: File) => void;
  setVibe: (vibe: Vibe) => void;
  setLocation: (loc: OnboardingData["location"]) => void;
}

const PROMPTS = ["A hobby in action", "Your happy place", "Caught laughing", "This is so me"];

export const useOnboarding = create<OnboardingState>((set) => ({
  hobbies: [],
  photos: PROMPTS.map((prompt) => ({ prompt, file: null, previewUrl: null })),
  vibe: null,
  location: { city: "", lat: null, lng: null },

  setHobbies: (hobbies) => set({ hobbies }),
  setPhoto: (index, file) =>
    set((state) => {
      const photos = [...state.photos];
      // Revoke the old preview URL to avoid leaking memory.
      if (photos[index].previewUrl) URL.revokeObjectURL(photos[index].previewUrl!);
      photos[index] = { ...photos[index], file, previewUrl: URL.createObjectURL(file) };
      return { photos };
    }),
  setVibe: (vibe) => set({ vibe }),
  setLocation: (location) => set({ location }),
}));
```

### 2. The frame: progress bar + AnimatePresence

This is the heart of the chapter. The `OnboardingWizard` is a single `"use client"` component. It owns the `step` index and a `direction` (so we know which way to slide), reads validity from a per-step validator, and only commits at the end.

```tsx
// components/onboarding/onboarding-wizard.tsx
"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/stores/use-onboarding";
import { saveOnboarding } from "@/app/onboarding/actions";
import { HobbiesStep } from "./steps/hobbies-step";
import { PhotosStep } from "./steps/photos-step";
import { VibeStep } from "./steps/vibe-step";
import { LocationStep } from "./steps/location-step";

const STEPS = [
  { key: "hobbies", title: "What are you into?", Component: HobbiesStep },
  { key: "photos", title: "Show us your world", Component: PhotosStep },
  { key: "vibe", title: "What's your vibe?", Component: VibeStep },
  { key: "location", title: "Where are you?", Component: LocationStep },
] as const;

const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 64 : -64, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -64 : 64, opacity: 0 }),
};

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const data = useOnboarding();

  const { title, Component } = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  // Each step exposes whether it's complete. Kept here so the frame owns the gate.
  const stepValid = validateStep(step, data);

  function goNext() {
    if (!stepValid) return;
    setError(null);
    if (isLast) return finish();
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  function finish() {
    startTransition(async () => {
      // Upload happens client-side; the action receives public URLs + plain data.
      const photoUrls = await uploadPhotos(data.photos);
      const result = await saveOnboarding({
        hobbies: data.hobbies,
        photos: photoUrls,
        vibe: data.vibe!,
        location: data.location,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.replace("/discover");
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      {/* Progress bar */}
      <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-pink-100">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
        />
      </div>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>

      {/* Animated step area */}
      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={STEPS[step].key}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <Component />
          </motion.div>
        </AnimatePresence>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Controls */}
      <div className="mt-6 flex items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            disabled={pending}
            className="rounded-full px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!stepValid || pending}
          className="ml-auto rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-200 transition disabled:opacity-40"
        >
          {pending ? "Saving…" : isLast ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

function validateStep(step: number, d: ReturnType<typeof useOnboarding.getState>) {
  switch (step) {
    case 0:
      return d.hobbies.length >= 3;
    case 1:
      return d.photos.filter((p) => p.file).length >= 3;
    case 2:
      return d.vibe !== null;
    case 3:
      return d.location.city.trim().length > 1;
    default:
      return false;
  }
}
```

> **`mode="wait"`** tells AnimatePresence to finish the exit animation before mounting the next step. Because we change the `key` on the `motion.div`, Framer Motion treats each step as a *new* element — that's what triggers enter/exit. The `custom` prop pipes `direction` into the variant functions so the slide direction follows the user.

### 3. A representative step: hobbies

Steps are dumb and focused. They read/write the store and nothing else — validation lives in the frame. Here's the hobbies chips selector.

```tsx
// components/onboarding/steps/hobbies-step.tsx
"use client";

import { motion } from "framer-motion";
import { useOnboarding } from "@/stores/use-onboarding";

const ALL_HOBBIES = [
  "Hiking", "Coffee", "Gaming", "Live music", "Cooking", "Photography",
  "Climbing", "Reading", "Cycling", "Painting", "Yoga", "Board games",
];

export function HobbiesStep() {
  const { hobbies, setHobbies } = useOnboarding();

  function toggle(h: string) {
    setHobbies(hobbies.includes(h) ? hobbies.filter((x) => x !== h) : [...hobbies, h]);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">Pick at least 3. This is how we find your people.</p>
      <div className="flex flex-wrap gap-2">
        {ALL_HOBBIES.map((h) => {
          const active = hobbies.includes(h);
          return (
            <motion.button
              key={h}
              type="button"
              onClick={() => toggle(h)}
              whileTap={{ scale: 0.94 }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-pink-300"
              }`}
            >
              {h}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
```

The vibe and location steps follow the same shape: read from the store, write on interaction. Location can call the browser Geolocation API and reverse-geocode, or just accept a typed city — keep the demo honest and let the user type.

### 4. The photos step + Supabase Storage upload

The prompt-based grid: each cell is a labeled file input that previews the chosen image.

```tsx
// components/onboarding/steps/photos-step.tsx
"use client";

import Image from "next/image";
import { useOnboarding } from "@/stores/use-onboarding";

export function PhotosStep() {
  const { photos, setPhoto } = useOnboarding();

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">Add 3–4 photos answering these prompts.</p>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((p, i) => (
          <label
            key={p.prompt}
            className="relative flex aspect-square cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 p-3"
          >
            {p.previewUrl && (
              <Image src={p.previewUrl} alt={p.prompt} fill className="object-cover" sizes="50vw" />
            )}
            <span className="relative z-10 rounded-md bg-black/45 px-2 py-1 text-xs font-medium text-white">
              {p.prompt}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhoto(i, file);
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
```

Uploading happens in the wizard's `finish()` via this client helper. We upload to a per-user folder so RLS-style Storage policies can scope access.

```ts
// lib/upload-photos.ts
import { createBrowserClient } from "@supabase/ssr";
import type { PromptPhoto } from "@/stores/use-onboarding";

export async function uploadPhotos(photos: PromptPhoto[]) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const filled = photos.filter((p) => p.file);
  const uploaded: { prompt: string; url: string }[] = [];

  for (const p of filled) {
    const ext = p.file!.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(path, p.file!, { upsert: false, contentType: p.file!.type });
    if (error) throw error;

    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    uploaded.push({ prompt: p.prompt, url: data.publicUrl });
  }

  return uploaded;
}
```

### 5. The `saveOnboarding` Server Action

The action runs on the server with the user's session. It validates again (never trust the client), writes the profile, flips `onboarded` to `true`, and revalidates discovery.

```ts
// app/onboarding/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface SavePayload {
  hobbies: string[];
  photos: { prompt: string; url: string }[];
  vibe: string;
  location: { city: string; lat: number | null; lng: number | null };
}

export async function saveOnboarding(payload: SavePayload) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  // Server-side validation — the gate of last resort.
  if (payload.hobbies.length < 3) return { error: "Pick at least 3 hobbies." };
  if (payload.photos.length < 3) return { error: "Add at least 3 photos." };
  if (!payload.vibe) return { error: "Choose a vibe." };
  if (payload.location.city.trim().length < 2) return { error: "Tell us your city." };

  const { error } = await supabase
    .from("profiles")
    .update({
      hobbies: payload.hobbies,
      photos: payload.photos,
      vibe: payload.vibe,
      city: payload.location.city,
      lat: payload.location.lat,
      lng: payload.location.lng,
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) return { error: "Couldn't save your profile. Try again." };

  revalidatePath("/discover");
  return { success: true };
}
```

### 6. Gate onboarding with `proxy.ts`

Next.js 16 replaces `middleware.ts` with `proxy.ts`. We use it to (a) keep the Supabase session fresh and (b) bounce already-onboarded users out of `/onboarding`, and un-onboarded users *into* it.

```ts
// proxy.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  if (user && pathname.startsWith("/onboarding")) {
    const { data: profile } = await supabase
      .from("profiles").select("onboarded").eq("id", user.id).single();
    if (profile?.onboarded) {
      return NextResponse.redirect(new URL("/discover", request.url));
    }
  }
  return response;
}

export const config = { matcher: ["/onboarding/:path*", "/discover/:path*"] };
```

---

## Architecture / diagram

```mermaid
flowchart TD
    A[User signs up] --> B{proxy.ts: onboarded?}
    B -- yes --> Z[/discover/]
    B -- no --> C[OnboardingWizard]

    subgraph Wizard [Single client component]
      C --> D[Step 0: Hobbies]
      D --> E[Step 1: Photos]
      E --> F[Step 2: Vibe]
      F --> G[Step 3: Location]
      D -. Zustand store .-> S[(OnboardingData)]
      E -. .-> S
      F -. .-> S
      G -. .-> S
    end

    G --> H[finish: uploadPhotos]
    H --> I[Supabase Storage]
    H --> J[saveOnboarding Server Action]
    J --> K[(profiles: onboarded=true)]
    J --> Z
```

The frame stays put; only the slide changes. State funnels into one Zustand object, then commits once.

---

## Best practices & pitfalls

- **Do** validate in *both* places — the client gate makes the UI feel responsive; the Server Action is the gate that actually matters.
- **Do** `URL.revokeObjectURL` previews when replacing a photo (shown in the store). Forgetting this leaks memory across a long session.
- **Don't** save per-step. A partially onboarded profile pollutes discovery. Commit atomically with `onboarded: true` as the final flip.
- **Don't** upload images *inside* the Server Action by serializing `File`s through it — large binaries don't belong in action payloads. Upload from the browser client, pass back URLs.
- **Do** use `AnimatePresence mode="wait"` for wizards. Without it, steps cross-fade on top of each other and look broken.
- **Don't** forget the `custom` prop. If you animate direction-aware slides but never pass `custom={direction}`, every step slides the same way regardless of Back/Next.
- **Do** make the Next button reflect state: disabled + dimmed when invalid, "Saving…" during the transition. Silent dead buttons feel broken.
- **Don't** trust client geolocation to always resolve. Always allow a typed city fallback.
- **Do** scope Storage uploads to `${user.id}/...` and back it with a Storage policy so users can't overwrite each other's photos.

---

## Exercises

1. **Reorder guard.** Add a `?step=` URL query param synced to the wizard so a refresh keeps the user on the same step (but still blocks skipping ahead past invalid steps). Use `useSearchParams` and `router.replace`.
2. **Caption editing.** Let users override a prompt's text with their own caption, stored alongside the photo URL in `profiles.photos`.
3. **Drag to reorder photos.** Use Framer Motion's `Reorder.Group` so the first photo becomes the profile's hero image.
4. **Optimistic finish.** Wrap the redirect in `useOptimistic` so the UI shows a celebratory confetti screen immediately, rolling back if `saveOnboarding` returns an error.
5. **Resumable drafts.** Persist the Zustand store to `localStorage` (via `persist` middleware) so a user who closes the tab mid-onboarding picks up where they left off — but clear it on successful finish.

---

## Mini-project: the "Almost there!" review step

Add a **fifth, read-only confirmation step** before Finish. It renders a compact summary card: the chosen hobbies as chips, a 2×2 grid of photo thumbnails with their prompts, the vibe as an emoji badge, and the city. Each section has an "Edit" link that jumps the wizard back to the relevant step (`setStep`) with the correct slide direction. The Finish button lives only on this step. This is the single highest-converting screen in most onboarding flows — seeing a polished preview of *themselves* makes users want to commit. Wire it so `saveOnboarding` is still only ever called once, from this review step.

---

## Key takeaways

- A wizard is **one component, one state object, one commit** — never a stack of routes.
- `AnimatePresence` with `mode="wait"`, a `key` per step, and a `custom` direction gives professional slide transitions in ~20 lines.
- Hold answers in **Zustand**; commit atomically through a **`saveOnboarding` Server Action** that re-validates server-side and flips `onboarded`.
- **Upload images from the browser**, pass URLs to the action; keep binaries out of action payloads.
- Gate the route with **`proxy.ts`** so onboarded users skip the flow and newcomers can't escape it.

**Up next — Chapter 21: The Discover Feed**, where those freshly-minted profiles come alive in a swipeable, vibe-filtered discovery experience.
