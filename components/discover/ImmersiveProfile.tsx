"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Sparkles, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { compatibility } from "@/lib/matching";
import {
  communityBySlug,
  favoritePlacesFor,
  interestBySlug,
  lifestyleCards,
  profileById,
  profilePhotos,
  promptsFor,
  timelineFor,
} from "@/lib/mock";
import { ACTIVITY } from "@/components/feed/activity";
import { Chip } from "@/components/ui/chip";
import { SafetyMenu } from "@/components/safety/SafetyMenu";
import { ConnectModal } from "./ConnectModal";

export function ImmersiveProfile({ profileId }: { profileId: string }) {
  const router = useRouter();
  const me = useStore((s) => s.me);
  const swipe = useStore((s) => s.swipe);
  const [connecting, setConnecting] = useState(false);

  const profile = profileById(profileId);
  const { score, sharedInterests } = compatibility(me, profile);
  const photos = profilePhotos(profile);
  const prompts = promptsFor(profile.id);
  const places = favoritePlacesFor(profile);
  const lifestyle = lifestyleCards(profile);
  const timeline = timelineFor(profile);
  const communities = profile.communities
    .map((s) => communityBySlug(s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const [photoIdx, setPhotoIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  function onPhotoScroll() {
    const el = trackRef.current;
    if (el) setPhotoIdx(Math.round(el.scrollLeft / el.clientWidth));
  }

  function skip() {
    swipe(profile.id, "pass");
    router.push("/discover");
  }

  return (
    <div className="pb-10">
      {/* Photo carousel hero */}
      <div className="relative">
        <button
          onClick={() => router.push("/discover")}
          className="absolute left-4 top-12 z-20 grid h-10 w-10 place-items-center rounded-full glass-deep text-ink shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div
          ref={trackRef}
          onScroll={onPhotoScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-lilac">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt="" className="h-full w-full object-cover" draggable={false} />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full bg-white/20 px-3 py-1 text-[13px] font-medium text-white backdrop-blur-sm">
                “{photo.prompt}”
              </span>
            </div>
          ))}
        </div>

        {/* dots */}
        {photos.length > 1 && (
          <div className="absolute left-1/2 top-3 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={i === photoIdx ? "h-1.5 w-6 rounded-full bg-white" : "h-1.5 w-1.5 rounded-full bg-white/50"}
              />
            ))}
          </div>
        )}

        <div className="absolute right-4 top-12 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full glass-deep px-3 py-1.5 shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-lavender-3" fill="currentColor" />
            <span className="text-sm font-bold text-lavender-3">{score}%</span>
            <span className="text-[11px] font-medium text-ink-soft">vibe</span>
          </div>
          <SafetyMenu profile={profile} />
        </div>
      </div>

      {/* Identity */}
      <div className="px-6 pt-5">
        <div className="flex items-end gap-2">
          <h1 className="font-display text-[30px] font-semibold leading-none text-ink">{profile.displayName}</h1>
          <span className="text-2xl font-light text-ink-soft">{profile.age}</span>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[14px] text-ink-soft">
          <MapPin className="h-4 w-4 text-lavender-3" />
          {profile.city} · {profile.distanceKm} km away
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink">{profile.bio}</p>
      </div>

      <div className="space-y-5 px-5 pt-5">
        {/* Shared interests */}
        {sharedInterests.length > 0 && (
          <Section>
            <div className="rounded-[24px] border border-lavender/30 bg-lilac/50 p-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-lavender-3">
                ✨ You both love
              </p>
              <div className="flex flex-wrap gap-2">
                {sharedInterests.map((s) => {
                  const it = interestBySlug(s);
                  return (
                    <Chip key={s} active>
                      <span>{it?.emoji}</span>
                      {it?.label}
                    </Chip>
                  );
                })}
              </div>
            </div>
          </Section>
        )}

        {/* Prompt 1 */}
        {prompts[0] && <PromptCard q={prompts[0].q} a={prompts[0].a} />}

        {/* How they live */}
        {lifestyle.length > 0 && (
          <Section title="How they live">
            <div className="grid grid-cols-2 gap-2.5">
              {lifestyle.map((l) => (
                <div
                  key={l.label}
                  className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white px-3.5 py-3 shadow-soft"
                >
                  <span className="text-xl">{l.emoji}</span>
                  <span className="text-[14px] font-medium text-ink">{l.label}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Prompt 2 */}
        {prompts[1] && <PromptCard q={prompts[1].q} a={prompts[1].a} />}

        {/* Favorite places */}
        {places.length > 0 && (
          <Section title="Favorite places">
            <div className="flex flex-wrap gap-2">
              {places.map((p) => (
                <Chip key={p} tone="powder">{p}</Chip>
              ))}
            </div>
          </Section>
        )}

        {/* Vibe tags */}
        <Section title="Their vibe">
          <div className="flex flex-wrap gap-2">
            {profile.vibeTags.map((v) => (
              <Chip key={v} tone="blush">{v}</Chip>
            ))}
          </div>
        </Section>

        {/* Prompt 3 */}
        {prompts[2] && <PromptCard q={prompts[2].q} a={prompts[2].a} />}

        {/* Communities */}
        {communities.length > 0 && (
          <Section title="Communities">
            <div className="flex flex-wrap gap-2">
              {communities.map((c) => (
                <Chip key={c.slug} tone="powder">
                  <span>{c.emoji}</span>
                  {c.name}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {/* Activity timeline */}
        <Section title="Activity timeline">
          <div className="columns-2 gap-3">
            {timeline.map((post, i) => {
              const activity = ACTIVITY[post.activityTag];
              return (
                <div
                  key={post.id}
                  className="mb-3 break-inside-avoid overflow-hidden rounded-[20px] border border-white/70 bg-white shadow-soft"
                >
                  {post.image && (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image}
                        alt=""
                        className={i % 3 === 0 ? "aspect-[3/4] w-full object-cover" : "aspect-square w-full object-cover"}
                        loading="lazy"
                      />
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full glass-deep px-2 py-0.5 text-[11px] font-semibold text-lavender-3">
                        <span>{activity.emoji}</span>
                        {activity.label}
                      </span>
                    </div>
                  )}
                  <div className="px-3 py-2.5">
                    <p className="line-clamp-2 text-[13px] leading-snug text-ink">{post.caption}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">{post.location}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Decision — only after exploring the whole profile */}
        <div className="rounded-[28px] border border-lavender/30 bg-lilac/40 p-6 text-center">
          <p className="font-display text-[20px] font-semibold text-ink">
            Feeling {profile.displayName}&apos;s vibe?
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">
            {score}% vibe · {sharedInterests.length} shared interests
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={skip}
              className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full bg-white text-lavender-2 shadow-soft ring-1 ring-lavender/40"
            >
              <X className="h-7 w-7" strokeWidth={2.6} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setConnecting(true)}
              className="flex h-[58px] flex-1 items-center justify-center gap-2 rounded-full gradient-primary text-[15px] font-semibold text-white shadow-[0_16px_40px_-12px_rgba(255,111,181,0.9)]"
            >
              <Sparkles className="h-5 w-5" fill="currentColor" />
              Catch the Vibe
            </motion.button>
          </div>
        </div>
      </div>

      <ConnectModal
        profile={connecting ? profile : null}
        onClose={() => setConnecting(false)}
        onDone={() => router.push("/discover")}
      />
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {title && (
        <p className="mb-2.5 px-1 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
          {title}
        </p>
      )}
      {children}
    </motion.div>
  );
}

function PromptCard({ q, a }: { q: string; a: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[24px] border border-white/70 bg-white p-5 shadow-soft"
    >
      <p className="text-[13px] font-semibold text-lavender-3">{q}</p>
      <p className="mt-1.5 font-display text-[20px] leading-snug text-ink">{a}</p>
    </motion.div>
  );
}
