"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Grid2x2, MapPin, Pencil, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { communityBySlug, interestBySlug, profileById, timelineFor } from "@/lib/mock";
import { compatibility } from "@/lib/matching";
import { Chip } from "@/components/ui/chip";
import { ACTIVITY } from "@/components/feed/activity";
import { TimeAgo } from "@/components/common/TimeAgo";
import { signOut } from "@/app/actions/auth";
import { SafetyMenu } from "@/components/safety/SafetyMenu";
import { EditProfileSheet } from "./EditProfileSheet";

export function ProfileView({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const me = useStore((s) => s.me);
  const matches = useStore((s) => s.matches);
  const posts = useStore((s) => s.posts);
  const allCommunities = useStore((s) => s.communities);
  const conversations = useStore((s) => s.conversations);

  const isMe = profileId === "me";
  const profile = isMe ? me : profileById(profileId);

  // Timeline: live store posts for me; a generated lifestyle timeline for others.
  const myPosts = posts.filter((p) => p.authorId === profile.id);
  const timeline = isMe ? myPosts : timelineFor(profile);

  // Communities: joined (live) for me; their listed communities for others.
  const communities = isMe
    ? allCommunities.filter((c) => c.joined)
    : profile.communities
        .map((slug) => communityBySlug(slug))
        .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const compat = isMe ? null : compatibility(me, profile);
  const convo = conversations.find((c) => c.withId === profile.id);

  const stats = isMe
    ? [
        { label: "Posts", value: myPosts.length },
        { label: "Matches", value: matches.length },
        { label: "Groups", value: communities.length },
      ]
    : [
        { label: "Posts", value: timeline.length },
        { label: "Vibe", value: `${compat!.score}%` },
        { label: "Shared", value: compat!.sharedInterests.length },
      ];

  return (
    <div className="pb-28">
      {/* Cinematic identity header — banner + floating polaroid (no circle) */}
      <div className="relative">
        <div className="relative h-[320px] overflow-hidden bg-lilac">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.photos[0] ?? profile.avatar}
            alt={profile.displayName}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/35" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-12">
            <button
              onClick={() => (isMe ? router.push("/discover") : router.back())}
              className="grid h-10 w-10 place-items-center rounded-full glass-deep text-ink shadow-soft"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {!isMe && <SafetyMenu profile={profile} />}
              {isMe ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-full glass-deep px-4 py-2 text-sm font-semibold text-lavender-3 shadow-soft"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              ) : (
                <Link
                  href={convo ? `/chat/${convo.id}` : "/chat"}
                  className="flex items-center gap-1.5 rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft"
                >
                  <Sparkles className="h-4 w-4" fill="currentColor" />
                  Say Hey
                </Link>
              )}
            </div>
          </div>

          {/* floating polaroid — a stacked identity tile, not a circle */}
          <motion.div
            initial={{ opacity: 0, y: 18, rotate: -9 }}
            animate={{ opacity: 1, y: 0, rotate: -5 }}
            transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.1 }}
            className="absolute -bottom-8 right-5 z-10"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-[20px] bg-white p-1.5 shadow-[0_18px_44px_-12px_rgba(255,111,181,0.75)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.photos[1] ?? profile.avatar}
                alt=""
                className="h-24 w-[76px] object-cover"
                style={{ borderRadius: "16px 16px 16px 5px" }}
              />
              <p className="pb-0.5 pt-1 text-center text-[10px] font-medium text-ink-soft">
                {isMe ? "that’s me ✨" : "their vibe ✨"}
              </p>
            </motion.div>
          </motion.div>

          <div className="absolute bottom-5 left-6 right-28 text-white">
            <div className="flex items-end gap-2">
              <h1 className="font-display text-[32px] font-semibold leading-none">
                {profile.displayName}
              </h1>
              <span className="text-2xl font-light opacity-90">{profile.age}</span>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-sm text-white/85">
              <MapPin className="h-4 w-4" />
              {profile.city}
              {!isMe && <span className="text-white/70"> · {profile.distanceKm} km away</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-12">
        <p className="text-[15px] leading-relaxed text-ink">{profile.bio}</p>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[20px] border border-white/70 bg-white/70 py-3.5 text-center shadow-soft"
            >
              <div className="font-display text-2xl font-semibold text-gradient">{s.value}</div>
              <div className="text-[12px] text-ink-soft">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Interests */}
        <Section title={isMe ? "Interests" : "What they're into"}>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((slug) => {
              const it = interestBySlug(slug);
              const shared = !isMe && compat!.sharedInterests.includes(slug);
              return (
                <Chip key={slug} active={shared}>
                  <span>{it?.emoji}</span>
                  {it?.label}
                </Chip>
              );
            })}
          </div>
        </Section>

        {/* Vibe */}
        <Section title={isMe ? "My vibe" : "Their vibe"}>
          <div className="flex flex-wrap gap-2">
            {profile.vibeTags.map((v) => (
              <Chip key={v} tone="blush">{v}</Chip>
            ))}
          </div>
        </Section>

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
        <div className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <Grid2x2 className="h-4 w-4 text-lavender-3" />
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
              Activity timeline
            </h2>
          </div>

          {timeline.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-lavender/50 bg-white/40 py-10 text-center">
              <p className="text-3xl">📸</p>
              <p className="mt-2 font-medium text-ink">
                {isMe ? "Your timeline is empty" : "No moments shared yet"}
              </p>
              {isMe && (
                <p className="text-sm text-ink-soft">Share a moment from the feed to start it.</p>
              )}
            </div>
          ) : (
            <div className="columns-2 gap-3">
              {timeline.map((p, i) => {
                const activity = ACTIVITY[p.activityTag];
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="mb-3 break-inside-avoid overflow-hidden rounded-[22px] border border-white/70 bg-white/70 shadow-soft"
                  >
                    {p.image && (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt=""
                          className={
                            i % 3 === 0
                              ? "aspect-[3/4] w-full object-cover"
                              : "aspect-square w-full object-cover"
                          }
                          loading="lazy"
                        />
                        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full glass-deep px-2 py-0.5 text-[11px] font-semibold text-lavender-3">
                          <span>{activity.emoji}</span>
                          {activity.label}
                        </span>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="line-clamp-2 text-[13px] leading-snug text-ink">{p.caption}</p>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-faint">
                        <span className="truncate">{p.location ?? activity.label}</span>
                        <TimeAgo iso={p.createdAt} className="shrink-0" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {isMe && (
          <form action={signOut} className="mt-8">
            <button
              type="submit"
              className="w-full rounded-full bg-white py-3 text-center text-sm font-semibold text-ink-soft shadow-soft"
            >
              Sign out
            </button>
          </form>
        )}
      </div>

      {isMe && <EditProfileSheet open={editing} onClose={() => setEditing(false)} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h2>
      {children}
    </div>
  );
}
