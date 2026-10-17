"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Sparkles } from "lucide-react";
import type { Post } from "@/lib/types";
import { profileById } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui/avatar";
import { TimeAgo } from "@/components/common/TimeAgo";
import { ACTIVITY } from "./activity";

export function PostCard({ post }: { post: Post }) {
  const author = profileById(post.authorId);
  const toggle = useStore((s) => s.toggleReaction);
  const activity = ACTIVITY[post.activityTag];
  const href = author.id === "me" ? "/profile" : `/u/${author.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-soft"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link href={href}>
          <Avatar src={author.avatar} alt={author.displayName} size={42} ring />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={href} className="font-semibold text-ink hover:text-lavender-3">
              {author.displayName}
            </Link>
            <span className="text-ink-faint">·</span>
            <TimeAgo iso={post.createdAt} className="text-sm text-ink-faint" />
          </div>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-ink-soft">
            <span className="inline-flex items-center gap-1 rounded-full bg-lilac/70 px-2 py-0.5 font-medium text-lavender-3">
              <span>{activity.emoji}</span>
              {activity.label}
            </span>
            {post.location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {post.location}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Caption */}
      <p className="px-4 py-3 text-[15px] leading-relaxed text-ink">{post.caption}</p>

      {/* Image */}
      {post.image && (
        <div className="px-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt=""
            className="aspect-[5/4] w-full rounded-[20px] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 px-5 py-3.5">
        <button
          onClick={() => toggle(post.id)}
          className="flex items-center gap-1.5"
        >
          <motion.span whileTap={{ scale: 1.4 }} transition={{ duration: 0.2 }}>
            <Sparkles
              className={post.reactedByMe ? "h-[22px] w-[22px] text-lavender-3" : "h-[22px] w-[22px] text-ink-faint"}
              fill={post.reactedByMe ? "currentColor" : "none"}
              strokeWidth={2.2}
            />
          </motion.span>
          <span className="text-sm font-medium text-ink-soft">{post.reactions}</span>
        </button>
        <button className="flex items-center gap-1.5">
          <MessageCircle className="h-[21px] w-[21px] text-ink-faint" strokeWidth={2.2} />
          <span className="text-sm font-medium text-ink-soft">{post.comments}</span>
        </button>
      </div>
    </motion.article>
  );
}
