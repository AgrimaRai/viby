export type Interest = {
  slug: string;
  label: string;
  emoji: string;
  category:
    | "fitness"
    | "arts"
    | "social"
    | "outdoors"
    | "food"
    | "tech"
    | "music"
    | "wellness";
};

export type Lifestyle = {
  sleep?: "early" | "night";
  work?: string;
  social?: "intimate" | "balanced" | "outgoing";
  pace?: "calm" | "balanced" | "fast";
};

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  age: number;
  bio: string;
  avatar: string;
  photos: string[];
  interests: string[]; // interest slugs
  vibeTags: string[];
  lifestyle: Lifestyle;
  city: string;
  distanceKm: number;
  communities: string[]; // community slugs
};

export type ActivityTag =
  | "gym"
  | "cafe"
  | "run"
  | "reading"
  | "travel"
  | "work"
  | "music"
  | "art"
  | "walk";

export type Post = {
  id: string;
  authorId: string;
  caption: string;
  image?: string;
  activityTag: ActivityTag;
  location?: string;
  createdAt: string;
  reactions: number;
  reactedByMe?: boolean;
  comments: number;
};

export type Community = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  cover: string;
  memberCount: number;
  joined?: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  cover: string;
  activityTag: ActivityTag;
  location: string;
  startsAt: string;
  hostId: string;
  communitySlug?: string;
  capacity: number;
  goingCount: number;
  rsvp?: "going" | "interested" | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  withId: string;
  compatibility: number;
  lastMessage: string;
  lastAt: string;
  unread: number;
};
