"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, CheckCircle2, Flag, MoreHorizontal, ShieldCheck, X } from "lucide-react";
import type { Profile } from "@/lib/types";
import { useStore } from "@/lib/store";
import { blockUser, reportContent } from "@/app/actions/safety";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REASONS: { key: string; label: string }[] = [
  { key: "harassment", label: "Harassment or bullying" },
  { key: "hate", label: "Hate or discrimination" },
  { key: "nudity", label: "Nudity or sexual content" },
  { key: "threat", label: "Threats or violence" },
  { key: "minor_safety", label: "Minor safety concern" },
  { key: "spam", label: "Spam or scam" },
  { key: "fake", label: "Fake account" },
  { key: "other", label: "Something else" },
];

type View = "menu" | "report" | "reported" | "block";

export function SafetyMenu({ profile, className }: { profile: Profile; className?: string }) {
  const router = useRouter();
  const block = useStore((s) => s.block);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setTimeout(() => {
      setView("menu");
      setReason(null);
      setNote("");
    }, 200);
  }

  async function submitReport() {
    if (!reason) return;
    setBusy(true);
    await reportContent({ targetType: "profile", targetId: profile.id, reason, note });
    setBusy(false);
    setView("reported");
  }

  async function confirmBlock() {
    setBusy(true);
    block(profile.id); // instant, demo + optimistic
    await blockUser(profile.id); // persists in connected mode
    setBusy(false);
    close();
    router.push("/discover");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Safety options"
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full glass-deep text-ink shadow-soft",
          className,
        )}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 z-[60] flex items-end"
            style={{ background: "rgba(46,42,58,0.4)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-[32px] bg-cream px-6 pb-8 pt-4"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink-faint/30" />

              {view === "menu" && (
                  <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h2 className="mb-1 font-display text-xl font-semibold text-ink">
                      {profile.displayName}
                    </h2>
                    <p className="mb-4 text-sm text-ink-soft">Keep Viby safe — these are private.</p>
                    <div className="space-y-2.5">
                      <Row icon={<Flag className="h-5 w-5" />} label="Report" onClick={() => setView("report")} />
                      <Row icon={<Ban className="h-5 w-5" />} label={`Block ${profile.displayName}`} danger onClick={() => setView("block")} />
                    </div>
                    <Button variant="ghost" className="mt-4 w-full" onClick={close}>Cancel</Button>
                  </motion.div>
                )}

                {view === "report" && (
                  <motion.div key="report" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <h2 className="font-display text-xl font-semibold text-ink">Report {profile.displayName}</h2>
                    <p className="mb-3 mt-1 text-sm text-ink-soft">What's going on? This is confidential.</p>
                    <div className="flex flex-wrap gap-2">
                      {REASONS.map((r) => (
                        <Chip key={r.key} interactive active={reason === r.key} onClick={() => setReason(r.key)}>
                          {r.label}
                        </Chip>
                      ))}
                    </div>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Add details (optional)"
                      className="mt-3 w-full resize-none rounded-2xl border border-white/70 bg-white px-4 py-3 text-[15px] text-ink shadow-soft outline-none placeholder:text-ink-faint focus:border-lavender"
                    />
                    <Button className="mt-4 w-full" disabled={!reason || busy} onClick={submitReport}>
                      {busy ? "Submitting…" : "Submit report"}
                    </Button>
                    <Button variant="ghost" className="mt-2 w-full" onClick={() => setView("menu")}>Back</Button>
                  </motion.div>
                )}

                {view === "reported" && (
                  <motion.div key="reported" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] gradient-primary text-white shadow-soft">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h2 className="mt-4 font-display text-xl font-semibold text-ink">Thanks for the heads up</h2>
                    <p className="mt-1 px-2 text-sm text-ink-soft">
                      Our safety team will review this. You can also block {profile.displayName} so they can't reach you.
                    </p>
                    <Button className="mt-5 w-full" onClick={() => setView("block")}>
                      <Ban className="h-4 w-4" /> Block {profile.displayName}
                    </Button>
                    <Button variant="ghost" className="mt-2 w-full" onClick={close}>Done</Button>
                  </motion.div>
                )}

                {view === "block" && (
                  <motion.div key="block" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-lilac text-lavender-3">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h2 className="mt-4 font-display text-xl font-semibold text-ink">Block {profile.displayName}?</h2>
                    <p className="mt-1 px-2 text-sm text-ink-soft">
                      They won't see you in Discover, your feed, or chats, and they can't message you. They won't be told.
                    </p>
                    <Button className="mt-5 w-full" disabled={busy} onClick={confirmBlock}>
                      {busy ? "Blocking…" : `Block ${profile.displayName}`}
                    </Button>
                    <Button variant="ghost" className="mt-2 w-full" onClick={() => setView("menu")}>Cancel</Button>
                  </motion.div>
                )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Row({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-white/70 bg-white px-4 py-3.5 text-left text-[15px] font-medium shadow-soft",
        danger ? "text-blush-2" : "text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
