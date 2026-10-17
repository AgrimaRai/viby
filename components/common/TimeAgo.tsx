"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";

/**
 * Relative timestamps depend on the current time, which differs between the
 * server render and client hydration — a guaranteed mismatch. We render the
 * initial value with suppressHydrationWarning and refresh it on the client.
 */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [label, setLabel] = useState(() => timeAgo(iso));

  useEffect(() => {
    setLabel(timeAgo(iso));
    const id = setInterval(() => setLabel(timeAgo(iso)), 60_000);
    return () => clearInterval(id);
  }, [iso]);

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}
