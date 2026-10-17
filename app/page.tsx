"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { DeviceFrame } from "@/components/shell/DeviceFrame";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

const previews = [
  { emoji: "📷", label: "Photo walks", tone: "lavender" as const },
  { emoji: "🏃", label: "Sunrise runs", tone: "blush" as const },
  { emoji: "🍵", label: "Matcha mornings", tone: "powder" as const },
  { emoji: "🚀", label: "Founder coffees", tone: "lavender" as const },
];

export default function Landing() {
  const router = useRouter();
  return (
    <DeviceFrame>
      <div className="flex h-full flex-col px-7 pb-10 pt-16">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size={30} />
        </motion.div>

        <div className="flex flex-1 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
            className="mb-8 h-28 w-28 self-start"
          >
            <div className="grid h-full w-full place-items-center rounded-[34px] gradient-lilac shadow-soft-lg animate-[breathe_3s_ease-in-out_infinite]">
              <Sparkles className="h-14 w-14 text-lavender-3" fill="currentColor" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-[40px] font-semibold leading-[1.08] tracking-tight text-ink"
          >
            Find your
            <br />
            <span className="text-gradient">people.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.6 }}
            className="mt-4 max-w-[19rem] text-[17px] leading-relaxed text-ink-soft"
          >
            Bond over the hobbies you love, share your real life, and meet people
            nearby who vibe like you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.6 }}
            className="mt-7 flex flex-wrap gap-2"
          >
            {previews.map((p, i) => (
              <motion.span
                key={p.label}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
              >
                <Chip tone={p.tone}>
                  <span>{p.emoji}</span>
                  {p.label}
                </Chip>
              </motion.span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.56, duration: 0.6 }}
          className="space-y-3"
        >
          <Button size="lg" className="w-full" onClick={() => router.push("/login")}>
            Get started
          </Button>
          <p className="text-center text-sm text-ink-faint">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="font-medium text-lavender-3"
            >
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </DeviceFrame>
  );
}
