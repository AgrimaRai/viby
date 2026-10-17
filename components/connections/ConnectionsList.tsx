"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { interestBySlug } from "@/lib/mock";
import { compatibility } from "@/lib/matching";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/button";

export function ConnectionsList() {
  const router = useRouter();
  const me = useStore((s) => s.me);
  const matches = useStore((s) => s.matches);
  const conversations = useStore((s) => s.conversations);

  function openChat(id: string) {
    const convo = conversations.find((c) => c.withId === id);
    router.push(convo ? `/chat/${convo.id}` : "/chat");
  }

  return (
    <div className="pb-28">
      <TopBar title="Your Circle" subtitle={`${matches.length} people you've vibed with`} />

      {matches.length === 0 ? (
        <div className="flex flex-col items-center px-10 pt-24 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-[30px] gradient-lilac shadow-soft">
            <UserPlus className="h-9 w-9 text-lavender-3" />
          </div>
          <h3 className="mt-6 font-display text-2xl font-semibold text-ink">No connections yet</h3>
          <p className="mt-2 max-w-xs text-ink-soft">
            Head to Discover, explore someone&apos;s world, and catch the vibe to start your circle.
          </p>
          <Button className="mt-6" onClick={() => router.push("/discover")}>
            <Sparkles className="h-4 w-4" fill="currentColor" />
            Discover people
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 px-5 pt-5">
          {matches.map((m, i) => {
            const shared = compatibility(me, m.profile).sharedInterests;
            return (
              <motion.div
                key={m.profile.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.4 }}
                onClick={() => router.push(`/u/${m.profile.id}`)}
                className="group relative cursor-pointer overflow-hidden rounded-[24px] shadow-soft"
              >
                <div className="relative aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.profile.avatar}
                    alt={m.profile.displayName}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-active:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/10" />

                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full glass-deep px-2.5 py-1 shadow-soft">
                    <Sparkles className="h-3 w-3 text-lavender-3" fill="currentColor" />
                    <span className="text-[12px] font-bold text-lavender-3">{m.score}%</span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="flex items-end gap-1.5">
                      <span className="font-display text-[18px] font-semibold leading-none">
                        {m.profile.displayName}
                      </span>
                      <span className="text-sm font-light opacity-90">{m.profile.age}</span>
                    </div>
                    {shared[0] && (
                      <p className="mt-1 truncate text-[12px] text-white/85">
                        {interestBySlug(shared[0])?.emoji} you both love{" "}
                        {interestBySlug(shared[0])?.label.toLowerCase()}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openChat(m.profile.id);
                      }}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-white/95 py-2 text-[13px] font-semibold text-lavender-3 backdrop-blur-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Say hey
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
