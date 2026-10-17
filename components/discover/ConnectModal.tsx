"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import type { Profile } from "@/lib/types";
import { useStore } from "@/lib/store";
import { compatibility } from "@/lib/matching";
import { interestBySlug } from "@/lib/mock";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export function ConnectModal({
  profile,
  onClose,
  onDone,
}: {
  profile: Profile | null;
  onClose: () => void;
  /** Called from "Keep exploring" after a spark is sent (defaults to onClose). */
  onDone?: () => void;
}) {
  const router = useRouter();
  const me = useStore((s) => s.me);
  const connect = useStore((s) => s.connect);

  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [convId, setConvId] = useState("");

  // Reset whenever a new profile opens the modal.
  useEffect(() => {
    setText("");
    setSent(false);
  }, [profile?.id]);

  if (!profile) {
    return <AnimatePresence />;
  }

  const { sharedInterests, score } = compatibility(me, profile);
  const shared = sharedInterests.map((s) => interestBySlug(s)).filter(Boolean);

  const mutualLine = shared[0]
    ? `You both love ${shared[0]!.label.toLowerCase()} ${shared[0]!.emoji}`
    : `You two would totally vibe ✨`;

  const icebreakers = [
    shared[0] && `We're both into ${shared[0]!.label.toLowerCase()} ${shared[0]!.emoji} — wanna do it together sometime?`,
    shared[1] && `Fellow ${shared[1]!.label.toLowerCase()} person! ${shared[1]!.emoji} what's your favorite spot?`,
    `Hey ${profile.displayName}! Your vibe is immaculate ✨ what's your weekend looking like?`,
  ].filter(Boolean) as string[];

  function sendSpark() {
    const intro =
      text.trim() || `Hey ${profile!.displayName}! ${mutualLine} — let's link up ✨`;
    const res = connect(profile!.id, intro);
    setConvId(res.convId);
    setSent(true);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="connect-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 grid place-items-center px-7"
        style={{ background: "rgba(46,42,58,0.4)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.88, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-cream p-6 shadow-soft-lg"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-lilac text-lavender-3"
          >
            <X className="h-4 w-4" />
          </button>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="compose"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -16 }}
              >
                {/* Avatars */}
                <div className="mb-4 flex items-center justify-center pt-2">
                  <Avatar src={me.avatar} alt="You" size={62} ring />
                  <div className="z-10 -mx-3 grid h-11 w-11 place-items-center rounded-full gradient-primary text-white shadow-soft">
                    <Sparkles className="h-5 w-5" fill="currentColor" />
                  </div>
                  <Avatar src={profile.avatar} alt={profile.displayName} size={62} ring />
                </div>

                <h2 className="text-center font-display text-[22px] font-semibold text-ink">
                  Say hey to {profile.displayName}
                </h2>

                {/* Mutual hobby highlight */}
                <div className="mt-2 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-lilac px-3.5 py-1.5 text-[13px] font-medium text-lavender-3">
                    {mutualLine}
                    <span className="text-ink-faint">· {score}% vibe</span>
                  </span>
                </div>

                {/* Icebreakers */}
                <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                  Need an opener?
                </p>
                <div className="flex flex-col gap-2">
                  {icebreakers.map((ib) => (
                    <button
                      key={ib}
                      onClick={() => setText(ib)}
                      className="rounded-2xl border border-lavender/40 bg-white/70 px-3.5 py-2 text-left text-[13px] leading-snug text-ink-soft transition-colors hover:border-lavender hover:text-ink"
                    >
                      {ib}
                    </button>
                  ))}
                </div>

                {/* Intro input */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  placeholder="Write your own intro…"
                  className="mt-3 w-full resize-none rounded-2xl border border-white/70 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink shadow-soft outline-none placeholder:text-ink-faint focus:border-lavender"
                />

                <Button className="mt-3 w-full" size="lg" onClick={sendSpark}>
                  <Sparkles className="h-5 w-5" fill="currentColor" />
                  Send a Spark
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="py-2 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 13 }}
                  className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] gradient-primary shadow-soft-lg"
                >
                  <motion.span
                    animate={{ scale: [1, 1.18, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    <Sparkles className="h-9 w-9 text-white" fill="currentColor" />
                  </motion.span>
                </motion.div>

                <h2 className="mt-5 font-display text-[24px] font-semibold text-gradient">
                  Spark sent! ✨
                </h2>
                <p className="mt-1 px-2 text-[15px] text-ink-soft">
                  You&apos;re in {profile.displayName}&apos;s circle now. {mutualLine}.
                </p>

                <div className="mt-6 space-y-2.5">
                  <Button
                    className="w-full"
                    onClick={() => {
                      onClose();
                      router.push(`/chat/${convId}`);
                    }}
                  >
                    Start the chat
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={onDone ?? onClose}>
                    Keep exploring
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
