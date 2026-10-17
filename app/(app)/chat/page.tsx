"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TopBar } from "@/components/shell/TopBar";
import { useStore } from "@/lib/store";
import { profileById } from "@/lib/mock";
import { Avatar } from "@/components/ui/avatar";
import { TimeAgo } from "@/components/common/TimeAgo";

export default function ChatListPage() {
  const conversations = useStore((s) => s.conversations);
  const matches = useStore((s) => s.matches);

  return (
    <div className="pb-28">
      <TopBar title="Chats" subtitle="People you've sparked with" />

      {/* New matches row */}
      {matches.length > 0 && (
        <div className="px-6 pt-4">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
            New connections
          </p>
          <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-1">
            {matches.map((m) => (
              <div key={m.profile.id} className="flex w-16 flex-col items-center gap-1.5">
                <Avatar src={m.profile.avatar} alt={m.profile.displayName} size={58} ring />
                <span className="truncate text-[12px] font-medium text-ink">{m.profile.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-5">
        <p className="mb-2 px-2 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
          Messages
        </p>
        <div className="space-y-1">
          {conversations.map((c, i) => {
            const p = profileById(c.withId);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
              >
                <Link
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-3 rounded-[22px] p-3 transition-colors hover:bg-white/70"
                >
                  <div className="relative">
                    <Avatar src={p.avatar} alt={p.displayName} size={56} ring />
                    <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-lilac px-1.5 py-0.5 text-[10px] font-bold text-lavender-3 ring-2 ring-cream">
                      {c.compatibility}%
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{p.displayName}</span>
                      <TimeAgo iso={c.lastAt} className="text-[12px] text-ink-faint" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={c.unread ? "truncate text-[14px] font-medium text-ink" : "truncate text-[14px] text-ink-soft"}>
                        {c.lastMessage}
                      </span>
                      {c.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full gradient-primary px-1.5 text-[11px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
