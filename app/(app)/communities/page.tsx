"use client";

import { motion } from "framer-motion";
import { Check, Plus, Users } from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { useStore } from "@/lib/store";

export default function CommunitiesPage() {
  const communities = useStore((s) => s.communities);
  const toggle = useStore((s) => s.toggleCommunity);
  const joined = communities.filter((c) => c.joined);

  return (
    <div className="pb-28">
      <TopBar
        title="Communities"
        subtitle="Find your corner of the world"
        action={
          <button className="grid h-10 w-10 place-items-center rounded-full glass text-lavender-3">
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-6 pt-4">
        {/* Your communities */}
        {joined.length > 0 && (
          <>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
              Your communities
            </p>
            <div className="no-scrollbar -mx-6 mb-6 flex gap-3 overflow-x-auto px-6 pb-1">
              {joined.map((c) => (
                <div
                  key={c.slug}
                  className="relative h-28 w-44 shrink-0 overflow-hidden rounded-[22px] shadow-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-lg">{c.emoji}</div>
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
          Discover groups
        </p>
        <div className="space-y-3.5">
          {communities.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="overflow-hidden rounded-[26px] border border-white/70 bg-white/70 shadow-soft"
            >
              <div className="relative h-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-2xl glass-deep text-xl">
                  {c.emoji}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold text-ink">{c.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-soft">
                      <Users className="h-3.5 w-3.5" />
                      {c.memberCount.toLocaleString()} members
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggle(c.slug)}
                    className={
                      c.joined
                        ? "flex shrink-0 items-center gap-1 rounded-full bg-lilac px-4 py-2 text-sm font-semibold text-lavender-3"
                        : "flex shrink-0 items-center gap-1 rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-soft"
                    }
                  >
                    {c.joined ? <><Check className="h-4 w-4" /> Joined</> : "Join"}
                  </motion.button>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{c.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
