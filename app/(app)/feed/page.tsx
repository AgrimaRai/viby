"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { TopBar } from "@/components/shell/TopBar";
import { PostCard } from "@/components/feed/PostCard";
import { Composer } from "@/components/feed/Composer";
import { ACTIVITY } from "@/components/feed/activity";
import { Chip } from "@/components/ui/chip";
import { useStore } from "@/lib/store";
import type { ActivityTag } from "@/lib/types";

const TAGS = Object.keys(ACTIVITY) as ActivityTag[];

export default function FeedPage() {
  const posts = useStore((s) => s.posts);
  const [filter, setFilter] = useState<ActivityTag | "all">("all");

  const visible = filter === "all" ? posts : posts.filter((p) => p.activityTag === filter);

  return (
    <div className="pb-28">
      <TopBar title="Activity" subtitle="Discover people through how they live" />

      {/* Activity-type filter */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-6 py-3">
        <Chip
          interactive
          active={filter === "all"}
          onClick={() => setFilter("all")}
          className="shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" fill="currentColor" /> All
        </Chip>
        {TAGS.map((t) => (
          <Chip
            key={t}
            interactive
            active={filter === t}
            onClick={() => setFilter(t)}
            className="shrink-0"
          >
            <span>{ACTIVITY[t].emoji}</span>
            {ACTIVITY[t].label}
          </Chip>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4 px-5 pt-1">
        {visible.length === 0 ? (
          <div className="mt-16 text-center text-ink-soft">
            <p className="text-4xl">{ACTIVITY[filter as ActivityTag]?.emoji ?? "✨"}</p>
            <p className="mt-3 font-medium text-ink">No {filter} moments yet</p>
            <p className="text-sm">Be the first to share one.</p>
          </div>
        ) : (
          visible.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      <Composer />
    </div>
  );
}
