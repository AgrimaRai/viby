"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { compatibility, rankCandidates } from "@/lib/matching";
import { interestBySlug, profilePhotos } from "@/lib/mock";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

export function DiscoverBrowse() {
  const remaining = useStore((s) => s.remaining);
  const me = useStore((s) => s.me);
  const reset = useStore((s) => s.resetDeck);
  const ranked = rankCandidates(me, remaining);

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 pb-3 pt-12 glass-deep">
        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight text-ink">
            Discover
          </h1>
          <p className="text-[13px] text-ink-soft">Tap a profile to explore their world</p>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-lilac text-lavender-3">
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </button>
      </div>

      {ranked.length === 0 ? (
        <div className="flex flex-col items-center px-10 pt-24 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-[30px] gradient-lilac shadow-soft">
            <Sparkles className="h-9 w-9 text-lavender-3" />
          </div>
          <h3 className="mt-6 font-display text-2xl font-semibold text-ink">All caught up</h3>
          <p className="mt-2 max-w-xs text-ink-soft">
            You&apos;ve seen everyone nearby for now. Take another look at today&apos;s vibes.
          </p>
          <Button variant="soft" className="mt-6" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Replay
          </Button>
        </div>
      ) : (
        <div className="space-y-5 px-5 pt-5">
          {ranked.map((p, i) => {
            const { score, sharedInterests } = compatibility(me, p);
            const teaser = profilePhotos(p)[1]?.prompt ?? "get to know me ✨";
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.985 }}
                className="relative px-1"
              >
                {/* stacked photo layer behind — collage depth */}
                <div
                  className="absolute left-3 right-3 top-1 h-[97%] overflow-hidden rounded-[30px] shadow-soft"
                  style={{ transform: "rotate(4deg)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profilePhotos(p)[1]?.src ?? p.avatar}
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-white/30" />
                </div>

                <Link
                  href={`/discover/${p.id}`}
                  className="relative block overflow-hidden rounded-[30px] shadow-soft-lg"
                >
                  <div className="relative aspect-[4/5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt={p.displayName} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/5" />

                    <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full glass-deep px-3 py-1.5 shadow-soft">
                      <Sparkles className="h-3.5 w-3.5 text-lavender-3" fill="currentColor" />
                      <span className="text-sm font-bold text-lavender-3">{score}%</span>
                    </div>

                    <div className="absolute left-4 top-4 max-w-[72%] rounded-2xl bg-white/15 px-3 py-1.5 text-[12px] font-medium leading-snug text-white backdrop-blur-md">
                      “{teaser}”
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <div className="flex items-end gap-2">
                        <h2 className="font-display text-[26px] font-semibold leading-none">{p.displayName}</h2>
                        <span className="text-xl font-light opacity-90">{p.age}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[13px] text-white/85">
                        <MapPin className="h-3.5 w-3.5" />
                        {p.city} · {p.distanceKm} km away
                      </div>
                      {sharedInterests.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {sharedInterests.slice(0, 3).map((s) => {
                            const it = interestBySlug(s);
                            return (
                              <span
                                key={s}
                                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-lavender-3 shadow-[0_10px_22px_-8px_rgba(255,111,181,0.85)]"
                              >
                                <span>{it?.emoji}</span>
                                {it?.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
