"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";

export function TopBar({
  title,
  subtitle,
  action,
  showAvatar = true,
}: {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  showAvatar?: boolean;
}) {
  const me = useStore((s) => s.me);
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-6 pb-3 pt-12 glass-deep">
      <div className="min-w-0">
        <h1 className="truncate font-display text-[26px] font-semibold leading-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="text-[13px] text-ink-soft">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {showAvatar && (
          <Link href="/profile">
            <Avatar src={me.avatar} alt="You" size={40} ring />
          </Link>
        )}
      </div>
    </div>
  );
}
