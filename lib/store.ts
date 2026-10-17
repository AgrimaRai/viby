"use client";

import { create } from "zustand";
import { compatibility } from "./matching";
import {
  COMMUNITIES,
  CONVERSATIONS,
  EVENTS,
  ME,
  MESSAGES,
  POSTS,
  PROFILES,
  profileById,
} from "./mock";
import type {
  Community,
  Conversation,
  EventItem,
  Message,
  Post,
  Profile,
} from "./types";

type Match = { profile: Profile; score: number; at: string };

type State = {
  me: Profile;
  onboarded: boolean;
  // discovery
  remaining: Profile[];
  savedIds: string[];
  passedIds: string[];
  blockedIds: string[];
  matches: Match[];
  lastMatch: Match | null;
  // content
  posts: Post[];
  communities: Community[];
  events: EventItem[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
};

type Actions = {
  completeOnboarding: (patch: Partial<Profile>) => void;
  updateMe: (patch: Partial<Profile>) => void;
  block: (id: string) => void;
  unblock: (id: string) => void;
  swipe: (id: string, dir: "save" | "pass") => Match | null;
  /** Send a spark: seed an intro message + create the connection. */
  connect: (id: string, intro: string) => { convId: string; score: number };
  clearLastMatch: () => void;
  resetDeck: () => void;
  toggleReaction: (postId: string) => void;
  addPost: (p: {
    caption: string;
    activityTag: Post["activityTag"];
    image?: string;
    location?: string;
  }) => void;
  toggleCommunity: (slug: string) => void;
  setRsvp: (eventId: string, status: "going" | "interested" | null) => void;
  sendMessage: (conversationId: string, body: string) => void;
  receiveMessage: (conversationId: string, senderId: string, body: string) => void;
  markRead: (conversationId: string) => void;
};

let counter = 1000;
const uid = () => `local-${counter++}`;

export const useStore = create<State & Actions>((set, get) => ({
  me: ME,
  onboarded: false,
  remaining: [...PROFILES],
  savedIds: [],
  passedIds: [],
  blockedIds: [],
  // Seed connections from existing conversations so "Circle" is alive on first visit.
  matches: CONVERSATIONS.map((c) => ({
    profile: profileById(c.withId),
    score: c.compatibility,
    at: c.lastAt,
  })),
  lastMatch: null,
  posts: [...POSTS],
  communities: [...COMMUNITIES],
  events: [...EVENTS],
  conversations: [...CONVERSATIONS],
  messages: { ...MESSAGES },

  completeOnboarding: (patch) =>
    set((s) => ({ onboarded: true, me: { ...s.me, ...patch } })),

  updateMe: (patch) => set((s) => ({ me: { ...s.me, ...patch } })),

  // Blocking makes a user mutually invisible: pull them from discovery,
  // connections, and chats, and remember them so they don't reappear.
  block: (id) =>
    set((s) => ({
      blockedIds: s.blockedIds.includes(id) ? s.blockedIds : [...s.blockedIds, id],
      remaining: s.remaining.filter((p) => p.id !== id),
      matches: s.matches.filter((m) => m.profile.id !== id),
      conversations: s.conversations.filter((c) => c.withId !== id),
    })),

  unblock: (id) =>
    set((s) => ({ blockedIds: s.blockedIds.filter((x) => x !== id) })),

  swipe: (id, dir) => {
    const { me, remaining } = get();
    const target = remaining.find((p) => p.id === id);
    set((s) => ({ remaining: s.remaining.filter((p) => p.id !== id) }));
    if (!target) return null;

    if (dir === "pass") {
      set((s) => ({ passedIds: [...s.passedIds, id] }));
      return null;
    }

    const { score } = compatibility(me, target);
    set((s) => ({ savedIds: [...s.savedIds, id] }));

    // Demo heuristic: strong compatibility => mutual match.
    if (score >= 80) {
      const match: Match = { profile: target, score, at: new Date().toISOString() };
      set((s) => ({ matches: [match, ...s.matches], lastMatch: match }));
      return match;
    }
    return null;
  },

  connect: (id, intro) => {
    const { me, remaining } = get();
    const target = remaining.find((p) => p.id === id) ?? profileById(id);
    const { score } = compatibility(me, target);
    let convId = `conv-${id}`;
    const now = new Date().toISOString();
    set((s) => {
      const existing = s.conversations.find((c) => c.withId === id);
      convId = existing ? existing.id : `conv-${id}`;
      const msg: Message = {
        id: uid(),
        conversationId: convId,
        senderId: "me",
        body: intro,
        createdAt: now,
      };
      const conversations = existing
        ? s.conversations.map((c) =>
            c.id === convId ? { ...c, lastMessage: intro, lastAt: now, unread: 0 } : c,
          )
        : [
            {
              id: convId,
              withId: id,
              compatibility: score,
              lastMessage: intro,
              lastAt: now,
              unread: 0,
            },
            ...s.conversations,
          ];
      const match: Match = { profile: target, score, at: now };
      const alreadyMatched = s.matches.some((m) => m.profile.id === id);
      return {
        remaining: s.remaining.filter((p) => p.id !== id),
        savedIds: s.savedIds.includes(id) ? s.savedIds : [...s.savedIds, id],
        conversations,
        messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), msg] },
        matches: alreadyMatched ? s.matches : [match, ...s.matches],
        lastMatch: match,
      };
    });
    return { convId, score };
  },

  clearLastMatch: () => set({ lastMatch: null }),

  resetDeck: () =>
    set({ remaining: [...PROFILES], savedIds: [], passedIds: [] }),

  toggleReaction: (postId) =>
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              reactedByMe: !p.reactedByMe,
              reactions: p.reactions + (p.reactedByMe ? -1 : 1),
            }
          : p,
      ),
    })),

  addPost: ({ caption, activityTag, image, location }) =>
    set((s) => ({
      posts: [
        {
          id: uid(),
          authorId: "me",
          caption,
          activityTag,
          image,
          location,
          createdAt: new Date().toISOString(),
          reactions: 0,
          comments: 0,
        },
        ...s.posts,
      ],
    })),

  toggleCommunity: (slug) =>
    set((s) => ({
      communities: s.communities.map((c) =>
        c.slug === slug
          ? {
              ...c,
              joined: !c.joined,
              memberCount: c.memberCount + (c.joined ? -1 : 1),
            }
          : c,
      ),
    })),

  setRsvp: (eventId, status) =>
    set((s) => ({
      events: s.events.map((e) => {
        if (e.id !== eventId) return e;
        const was = e.rsvp;
        const goingDelta =
          (status === "going" ? 1 : 0) - (was === "going" ? 1 : 0);
        return { ...e, rsvp: status, goingCount: e.goingCount + goingDelta };
      }),
    })),

  sendMessage: (conversationId, body) =>
    set((s) => {
      const msg: Message = {
        id: uid(),
        conversationId,
        senderId: "me",
        body,
        createdAt: new Date().toISOString(),
      };
      return {
        messages: {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] ?? []), msg],
        },
        conversations: s.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: body, lastAt: msg.createdAt, unread: 0 }
            : c,
        ),
      };
    }),

  receiveMessage: (conversationId, senderId, body) =>
    set((s) => {
      const msg: Message = {
        id: uid(),
        conversationId,
        senderId,
        body,
        createdAt: new Date().toISOString(),
      };
      return {
        messages: {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] ?? []), msg],
        },
        conversations: s.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: body, lastAt: msg.createdAt }
            : c,
        ),
      };
    }),

  markRead: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread: 0 } : c,
      ),
    })),
}));

export { profileById };
