"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { useStore } from "@/lib/store";
import { profileById } from "@/lib/mock";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const EMPTY: never[] = [];

const REPLIES = [
  "omg yes 😄",
  "that sounds perfect honestly",
  "haha I was just thinking that",
  "okay I'm officially in",
  "let's do it ✨",
  "you read my mind",
];

export default function ChatThread({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const messages = useStore((s) => s.messages[id] ?? EMPTY);
  const conversation = useStore((s) => s.conversations.find((c) => c.id === id));
  const send = useStore((s) => s.sendMessage);
  const receive = useStore((s) => s.receiveMessage);
  const markRead = useStore((s) => s.markRead);

  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyIdx = useRef(0);

  const partner = profileById(conversation?.withId ?? "p1");

  useEffect(() => {
    markRead(id);
  }, [id, markRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function handleSend() {
    const body = text.trim();
    if (!body) return;
    send(id, body);
    setText("");
    setTyping(true);
    const reply = REPLIES[replyIdx.current % REPLIES.length];
    replyIdx.current += 1;
    setTimeout(() => {
      setTyping(false);
      receive(id, partner.id, reply);
    }, 1600);
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-aurora">
      {/* Header */}
      <div className="z-10 flex items-center gap-3 px-4 pb-3 pt-12 glass-deep">
        <Link
          href="/chat"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-ink shadow-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={`/u/${partner.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={partner.avatar} alt={partner.displayName} size={42} ring />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">{partner.displayName}</div>
            <div className="text-[12px] text-lavender-3">
              {conversation?.compatibility ?? 90}% vibe · {typing ? "typing…" : "active now"}
            </div>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-5">
        <div className="mb-4 text-center">
          <span className="rounded-full bg-white/60 px-3 py-1 text-[12px] text-ink-faint">
            You connected over {partner.interests.length} shared interests ✨
          </span>
        </div>
        {messages.map((m) => {
          const mine = m.senderId === "me";
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[78%] px-4 py-2.5 text-[15px] leading-snug shadow-soft",
                  mine
                    ? "gradient-primary rounded-[20px] rounded-br-md text-white"
                    : "rounded-[20px] rounded-bl-md bg-white text-ink",
                )}
              >
                {m.body}
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-1 rounded-[20px] rounded-bl-md bg-white px-4 py-3.5 shadow-soft">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-ink-faint"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 px-4 pb-7 pt-3 glass-deep">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Message…"
          className="h-12 flex-1 rounded-full border border-white/70 bg-white/80 px-5 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-lavender"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full gradient-primary text-white shadow-soft"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
