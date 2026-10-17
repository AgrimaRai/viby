"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, X } from "lucide-react";
import { INTERESTS, VIBE_TAGS } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { hasSupabase } from "@/lib/supabase/config";
import { uploadImage } from "@/lib/supabase/storage";
import { saveProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export function EditProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useStore((s) => s.me);
  const updateMe = useStore((s) => s.updateMe);

  const [name, setName] = useState(me.displayName);
  const [bio, setBio] = useState(me.bio);
  const [city, setCity] = useState(me.city);
  const [interests, setInterests] = useState<string[]>(me.interests);
  const [vibes, setVibes] = useState<string[]>(me.vibeTags);
  const [photos, setPhotos] = useState<string[]>(me.photos.length ? me.photos : [me.avatar]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggle = (
    set: (u: (p: string[]) => string[]) => void,
    v: string,
    max = 99,
  ) =>
    set((p) =>
      p.includes(v) ? p.filter((x) => x !== v) : p.length < max ? [...p, v] : p,
    );

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "profile");
      setPhotos((p) => [...p, url]);
    } catch {
      /* surfaced via disabled state; keep UI calm */
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function addPhoto() {
    if (hasSupabase) {
      fileRef.current?.click();
    } else {
      // Demo: simulate an upload with a fresh aesthetic image.
      setPhotos((p) => [...p, `https://picsum.photos/seed/edit-${p.length}-${Date.now() % 9999}/400/520`]);
    }
  }

  async function save() {
    setSaving(true);
    const patch = {
      displayName: name || "You",
      bio,
      city,
      interests,
      vibeTags: vibes,
      photos,
      avatar: photos[0] ?? me.avatar,
    };
    updateMe(patch); // instant UI in both modes
    if (hasSupabase) {
      await saveProfile({ displayName: patch.displayName, bio, city, interests, vibeTags: vibes, photos });
    }
    setSaving(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 z-50 flex items-end"
          style={{ background: "rgba(46,42,58,0.4)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="no-scrollbar max-h-[88%] w-full overflow-y-auto rounded-t-[32px] bg-cream px-6 pb-8 pt-4"
          >
            <div className="sticky top-0 -mx-6 -mt-4 mb-2 bg-cream/90 px-6 pb-2 pt-4 backdrop-blur">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink-faint/30" />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">Edit profile</h2>
                <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-lilac text-lavender-3">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Photos */}
            <p className="mb-2 mt-2 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Photos</p>
            <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
              {photos.map((src, i) => (
                <div key={i} className="relative h-28 w-[88px] shrink-0 overflow-hidden rounded-2xl shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {photos.length > 1 && (
                    <button
                      onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPhoto}
                disabled={uploading}
                className="grid h-28 w-[88px] shrink-0 place-items-center rounded-2xl border-2 border-dashed border-lavender/50 bg-white/50 text-lavender-3"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
            </div>

            {/* Name / bio / city */}
            <div className="mt-5 space-y-3">
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-white px-4 py-3 text-[15px] text-ink shadow-soft outline-none focus:border-lavender"
                />
              </Field>
              <Field label="Bio">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-white/70 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink shadow-soft outline-none focus:border-lavender"
                />
              </Field>
              <Field label="City">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-white px-4 py-3 text-[15px] text-ink shadow-soft outline-none focus:border-lavender"
                />
              </Field>
            </div>

            {/* Interests */}
            <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
              Interests · {interests.length}
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((it) => (
                <Chip key={it.slug} interactive active={interests.includes(it.slug)} onClick={() => toggle(setInterests, it.slug)}>
                  <span>{it.emoji}</span>
                  {it.label}
                </Chip>
              ))}
            </div>

            {/* Vibe */}
            <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
              Vibe · {vibes.length}/5
            </p>
            <div className="flex flex-wrap gap-2">
              {VIBE_TAGS.map((v) => (
                <Chip key={v} interactive tone="blush" active={vibes.includes(v)} onClick={() => toggle(setVibes, v, 5)}>
                  {v}
                </Chip>
              ))}
            </div>

            <Button size="lg" className="mt-6 w-full" onClick={save} disabled={saving || uploading}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      {children}
    </label>
  );
}
