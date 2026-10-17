"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Camera, Check, MapPin } from "lucide-react";
import { DeviceFrame } from "@/components/shell/DeviceFrame";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { INTERESTS, VIBE_TAGS } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { hasSupabase } from "@/lib/supabase/config";
import { saveOnboarding } from "@/app/actions/auth";

const TOTAL = 5;
const ease = [0.22, 1, 0.36, 1] as const;

/* Personality-driven photo prompts (encourage a scrapbook, not a headshot). */
const PHOTO_SLOTS = [
  { label: "this is me", img: "https://i.pravatar.cc/400?img=13" },
  { label: "my weekend vibe", img: "https://picsum.photos/seed/onb-weekend/400/520" },
  { label: "a hobby i love", img: "https://picsum.photos/seed/onb-hobby/400/520" },
  { label: "my comfort place", img: "https://picsum.photos/seed/onb-comfort/400/520" },
];

export default function Onboarding() {
  const router = useRouter();
  const complete = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [city, setCity] = useState("San Francisco");
  const [radius, setRadius] = useState(25);
  const [photos, setPhotos] = useState<boolean[]>([false, false, false, false]);
  const photoCount = photos.filter(Boolean).length;

  const go = (d: number) => {
    setDir(d);
    setStep((s) => Math.min(TOTAL, Math.max(0, s + d)));
  };

  const finish = async () => {
    const displayName = name || "You";
    const finalBio = bio || "Here to meet people who vibe like me. ✨";
    const photoUrls = PHOTO_SLOTS.filter((_, i) => photos[i]).map((s) => s.img);

    if (hasSupabase) {
      // Connected mode: persist the real profile + flip `onboarded`.
      await saveOnboarding({
        displayName,
        bio: finalBio,
        interests: hobbies,
        vibeTags: vibes,
        city,
        photos: photoUrls,
      });
    } else {
      // Demo mode: hydrate the in-memory store.
      complete({ displayName, bio: finalBio, interests: hobbies, vibeTags: vibes, city });
    }
    router.push("/discover");
  };

  const toggle = (
    set: (updater: (prev: string[]) => string[]) => void,
    v: string,
    max = 99,
  ) => {
    set((prev) =>
      prev.includes(v)
        ? prev.filter((x) => x !== v)
        : prev.length < max
          ? [...prev, v]
          : prev,
    );
  };

  const canContinue =
    (step === 0) ||
    (step === 1 && hobbies.length >= 3) ||
    (step === 2 && name.trim().length > 0 && photoCount >= 3) ||
    (step === 3 && vibes.length >= 2) ||
    step === 4;

  return (
    <DeviceFrame>
      <div className="flex h-full flex-col px-7 pb-8 pt-14">
        {/* Progress */}
        <div className="flex items-center gap-3">
          {step > 0 && step < TOTAL && (
            <button
              onClick={() => go(-1)}
              className="grid h-9 w-9 place-items-center rounded-full glass text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {step < TOTAL && (
            <div className="flex flex-1 gap-1.5">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-lilac">
                  <motion.div
                    className="h-full gradient-primary"
                    initial={false}
                    animate={{ width: i < step ? "100%" : i === step ? "55%" : "0%" }}
                    transition={{ duration: 0.4, ease }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden pt-8">
          <AnimatePresence mode="wait" custom={dir}>
            {/* 0 — Welcome */}
            {step === 0 && (
              <Step key="welcome" dir={dir}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 16 }}
                  className="mb-7 grid h-24 w-24 place-items-center rounded-[30px] gradient-lilac shadow-soft-lg"
                >
                  <span className="text-4xl">👋</span>
                </motion.div>
                <h1 className="font-display text-[34px] font-semibold leading-tight text-ink">
                  Let&apos;s set
                  <br />
                  your <span className="text-gradient">vibe</span>.
                </h1>
                <p className="mt-3 max-w-xs text-[16px] leading-relaxed text-ink-soft">
                  A few quick taps and we&apos;ll find people nearby who love the
                  same things you do.
                </p>
              </Step>
            )}

            {/* 1 — Hobbies */}
            {step === 1 && (
              <Step key="hobbies" dir={dir}>
                <StepHead
                  title="What are you into?"
                  sub={`Pick at least 3 · ${hobbies.length} selected`}
                />
                <div className="no-scrollbar -mx-1 flex flex-1 flex-wrap content-start gap-2 overflow-y-auto px-1 pb-2">
                  {INTERESTS.map((it) => (
                    <Chip
                      key={it.slug}
                      interactive
                      active={hobbies.includes(it.slug)}
                      onClick={() => toggle(setHobbies, it.slug)}
                    >
                      <span>{it.emoji}</span>
                      {it.label}
                    </Chip>
                  ))}
                </div>
              </Step>
            )}

            {/* 2 — Profile */}
            {step === 2 && (
              <Step key="profile" dir={dir}>
                <StepHead
                  title="Show your world"
                  sub={`Add at least 3 photos that feel like you · ${photoCount}/4`}
                />
                <div className="no-scrollbar flex-1 overflow-y-auto pb-1">
                  <div className="grid grid-cols-2 gap-3">
                    {PHOTO_SLOTS.map((slot, i) => {
                      const filled = photos[i];
                      return (
                        <button
                          key={slot.label}
                          onClick={() =>
                            setPhotos((p) => p.map((v, idx) => (idx === i ? !v : v)))
                          }
                          className={cn(
                            "relative aspect-[4/5] overflow-hidden rounded-[22px] border-2 border-dashed transition-all",
                            filled ? "border-transparent shadow-soft" : "border-lavender/50 bg-white/50",
                          )}
                        >
                          {filled ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={slot.img} alt="" className="h-full w-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                                <span className="text-[11px] font-medium text-white">“{slot.label}”</span>
                              </div>
                              <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full gradient-primary text-white shadow-soft">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            </>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-1.5 px-2 text-center text-lavender-3">
                              <Camera className="h-5 w-5" />
                              <span className="text-[11px] font-medium leading-tight">{slot.label}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 space-y-3">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your first name"
                      className="w-full rounded-2xl border border-white/70 bg-white/70 px-5 py-3.5 text-[16px] text-ink shadow-soft outline-none placeholder:text-ink-faint focus:border-lavender"
                    />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      placeholder="A line about you — what's your perfect Saturday?"
                      className="w-full resize-none rounded-2xl border border-white/70 bg-white/70 px-5 py-3.5 text-[15px] leading-relaxed text-ink shadow-soft outline-none placeholder:text-ink-faint focus:border-lavender"
                    />
                  </div>
                </div>
              </Step>
            )}

            {/* 3 — Vibe */}
            {step === 3 && (
              <Step key="vibe" dir={dir}>
                <StepHead
                  title="Your energy"
                  sub={`Pick the tags that feel like you · ${vibes.length} selected`}
                />
                <div className="-mx-1 flex flex-wrap content-start gap-2 px-1">
                  {VIBE_TAGS.map((v) => (
                    <Chip
                      key={v}
                      interactive
                      tone="blush"
                      active={vibes.includes(v)}
                      onClick={() => toggle(setVibes, v, 5)}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </Step>
            )}

            {/* 4 — Location */}
            {step === 4 && (
              <Step key="location" dir={dir}>
                <StepHead title="Where are you?" sub="We'll show you people and meetups nearby." />
                <div className="rounded-[24px] border border-white/70 bg-white/60 p-5 shadow-soft">
                  <label className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-lilac text-lavender-3">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex-1 bg-transparent text-[16px] font-medium text-ink outline-none"
                    />
                  </label>
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-soft">Search radius</span>
                      <span className="font-semibold text-lavender-3">{radius} km</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={radius}
                      onChange={(e) => setRadius(+e.target.value)}
                      className="mt-3 w-full accent-[#a88ff5]"
                    />
                  </div>
                </div>
              </Step>
            )}

            {/* 5 — Celebration */}
            {step === TOTAL && (
              <Step key="done" dir={dir}>
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 12 }}
                    className="grid h-28 w-28 place-items-center rounded-[34px] gradient-primary shadow-soft-lg"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="text-5xl"
                    >
                      🎉
                    </motion.span>
                  </motion.div>
                  <h1 className="mt-7 font-display text-[32px] font-semibold text-ink">
                    You&apos;re in{name ? `, ${name}` : ""}!
                  </h1>
                  <p className="mt-3 max-w-xs text-ink-soft">
                    We found <span className="font-semibold text-lavender-3">people nearby</span>{" "}
                    who love {hobbies.slice(0, 2).map((h) => INTERESTS.find((i) => i.slug === h)?.label).join(" & ") || "what you love"}.
                  </p>
                </div>
              </Step>
            )}
          </AnimatePresence>
        </div>

        {/* Footer CTA */}
        <div className="pt-4">
          {step < TOTAL ? (
            <Button
              size="lg"
              className="w-full"
              disabled={!canContinue}
              onClick={() => (step === TOTAL - 1 ? go(1) : go(1))}
            >
              {step === 0 ? "Let's go" : step === TOTAL - 1 ? "Finish up" : "Continue"}
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={finish}>
              Start discovering
            </Button>
          )}
        </div>
      </div>
    </DeviceFrame>
  );
}

function Step({
  children,
  dir,
}: {
  children: React.ReactNode;
  dir: number;
}) {
  return (
    <motion.div
      custom={dir}
      initial={{ opacity: 0, x: dir * 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: dir * -40 }}
      transition={{ duration: 0.4, ease }}
      className="flex flex-1 flex-col overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function StepHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[28px] font-semibold leading-tight text-ink">
        {title}
      </h1>
      <p className="mt-1.5 text-[15px] text-ink-soft">{sub}</p>
    </div>
  );
}
