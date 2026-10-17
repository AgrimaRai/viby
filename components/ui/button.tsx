"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary:
          "gradient-primary text-white shadow-[0_14px_34px_-12px_rgba(255,111,181,0.6)]",
        soft: "bg-white text-ink shadow-soft border border-white/70",
        ghost: "bg-lilac/60 text-lavender-3 hover:bg-lilac",
        glass: "glass text-ink",
        outline: "border border-lavender/60 text-lavender-3 bg-white/40",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-full",
        md: "h-12 px-6 text-[15px] rounded-full",
        lg: "h-14 px-8 text-base rounded-full",
        icon: "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(button({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
