"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, MapPin, Plus } from "lucide-react";
import type { ActivityTag } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ACTIVITY } from "./activity";

const TAGS = Object.keys(ACTIVITY) as ActivityTag[];

export function Composer() {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [tag, setTag] = useState<ActivityTag>("cafe");
  const [location, setLocation] = useState("");
  const [withPhoto, setWithPhoto] = useState(true);
  const addPost = useStore((s) => s.addPost);

  function share() {
    addPost({
      caption: caption.trim() || `A little ${ACTIVITY[tag].label.toLowerCase()} moment ${ACTIVITY[tag].emoji}`,
      activityTag: tag,
      location: location.trim() || undefined,
      image: withPhoto
        ? `https://picsum.photos/seed/${tag}-${caption.length}-${Date.now() % 9999}/1000/800`
        : undefined,
    });
    setCaption("");
    setLocation("");
    setOpen(false);
  }

  return (
    <>
      {/* Floating compose button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="absolute bottom-28 right-5 z-20 grid h-14 w-14 place-items-center rounded-full gradient-primary text-white shadow-[0_18px_40px_-12px_rgba(255,111,181,0.85)]"
      >
        <Plus className="h-7 w-7" strokeWidth={2.6} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 z-40 flex items-end"
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
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-ink-faint/30" />
              <h2 className="font-display text-xl font-semibold text-ink">
                Share an activity
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                What are you up to right now?
              </p>

              <textarea
                autoFocus
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Morning matcha and a good book…"
                className="mt-4 w-full resize-none rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-[15px] leading-relaxed text-ink shadow-soft outline-none placeholder:text-ink-faint focus:border-lavender"
              />

              <p className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
                Activity
              </p>
              <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {TAGS.map((t) => (
                  <Chip
                    key={t}
                    interactive
                    active={tag === t}
                    onClick={() => setTag(t)}
                    className="shrink-0"
                  >
                    <span>{ACTIVITY[t].emoji}</span>
                    {ACTIVITY[t].label}
                  </Chip>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 shadow-soft focus-within:border-lavender">
                <MapPin className="h-5 w-5 text-lavender-3" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add a location"
                  className="h-12 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
                />
              </div>

              <button
                onClick={() => setWithPhoto((v) => !v)}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-lavender-3"
              >
                <ImagePlus className="h-5 w-5" />
                {withPhoto ? "Photo attached" : "Add a photo"}
              </button>

              <Button className="mt-5 w-full" size="lg" onClick={share}>
                Share to feed
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
