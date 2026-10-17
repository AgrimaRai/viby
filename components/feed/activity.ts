import type { ActivityTag } from "@/lib/types";

export const ACTIVITY: Record<ActivityTag, { label: string; emoji: string }> = {
  gym: { label: "Gym", emoji: "🏋️" },
  cafe: { label: "Café", emoji: "☕️" },
  run: { label: "Run", emoji: "🏃" },
  reading: { label: "Reading", emoji: "📚" },
  travel: { label: "Travel", emoji: "✈️" },
  work: { label: "Deep work", emoji: "💻" },
  music: { label: "Music", emoji: "🎵" },
  art: { label: "Art", emoji: "🎨" },
  walk: { label: "Walk", emoji: "🌅" },
};
