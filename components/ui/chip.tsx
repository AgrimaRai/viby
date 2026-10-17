"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ChipProps = {
  active?: boolean;
  interactive?: boolean;
  tone?: "lavender" | "blush" | "powder" | "neutral";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

const tones: Record<NonNullable<ChipProps["tone"]>, string> = {
  lavender: "bg-lilac text-lavender-3",
  blush: "bg-blush/40 text-[#d65b94]",
  powder: "bg-powder/40 text-[#3f78c2]",
  neutral: "bg-white text-ink-soft border border-black/5",
};

export function Chip({
  active,
  interactive,
  tone = "lavender",
  className,
  children,
  onClick,
}: ChipProps) {
  const Comp = interactive ? motion.button : motion.span;
  return (
    <Comp
      onClick={onClick}
      whileTap={interactive ? { scale: 0.94 } : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
        active
          ? "gradient-primary text-white shadow-[0_8px_20px_-8px_rgba(255,111,181,0.75)]"
          : tones[tone],
        interactive && "cursor-pointer",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
