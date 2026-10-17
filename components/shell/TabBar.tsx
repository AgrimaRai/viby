"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Newspaper,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/communities", label: "Groups", icon: Users },
  { href: "/connections", label: "Circle", icon: UserPlus },
  { href: "/chat", label: "Chats", icon: MessageCircle },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const unread = useStore((s) =>
    s.conversations.reduce((n, c) => n + c.unread, 0),
  );

  // Full-screen views (chat threads, immersive profiles) hide the tab bar.
  if (/^\/(chat|discover)\/.+/.test(pathname)) return null;

  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
      <div className="glass-deep pointer-events-auto flex w-full max-w-sm items-center justify-between rounded-[26px] px-2 py-2 shadow-[0_20px_50px_-20px_rgba(120,90,210,0.5)]">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-2xl gradient-lilac"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-colors",
                    active ? "text-lavender-3" : "text-ink-faint",
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                {t.href === "/chat" && unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-blush-2 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "relative text-[10px] font-medium transition-colors",
                  active ? "text-lavender-3" : "text-ink-faint",
                )}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
