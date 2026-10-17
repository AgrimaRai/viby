import type {
  ActivityTag,
  Community,
  Conversation,
  EventItem,
  Interest,
  Message,
  Post,
  Profile,
} from "./types";

/* Stable, always-loading imagery for the demo (no broken images, no API keys). */
const face = (n: number) => `https://i.pravatar.cc/800?img=${n}`;
const scene = (seed: string, w = 800, h = 1000) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/* ───────────────────────── Interests taxonomy ───────────────────────── */
export const INTERESTS: Interest[] = [
  { slug: "coffee", label: "Coffee", emoji: "☕️", category: "food" },
  { slug: "gym", label: "Gym", emoji: "🏋️", category: "fitness" },
  { slug: "running", label: "Running", emoji: "🏃", category: "fitness" },
  { slug: "yoga", label: "Yoga", emoji: "🧘", category: "wellness" },
  { slug: "photography", label: "Photography", emoji: "📷", category: "arts" },
  { slug: "reading", label: "Reading", emoji: "📚", category: "arts" },
  { slug: "music", label: "Live Music", emoji: "🎧", category: "music" },
  { slug: "vinyl", label: "Vinyl", emoji: "🎵", category: "music" },
  { slug: "startups", label: "Startups", emoji: "🚀", category: "tech" },
  { slug: "design", label: "Design", emoji: "🎨", category: "arts" },
  { slug: "hiking", label: "Hiking", emoji: "🥾", category: "outdoors" },
  { slug: "cycling", label: "Cycling", emoji: "🚲", category: "outdoors" },
  { slug: "cooking", label: "Cooking", emoji: "🍳", category: "food" },
  { slug: "matcha", label: "Matcha", emoji: "🍵", category: "food" },
  { slug: "gaming", label: "Gaming", emoji: "🎮", category: "social" },
  { slug: "travel", label: "Travel", emoji: "✈️", category: "outdoors" },
  { slug: "film", label: "Film", emoji: "🎬", category: "arts" },
  { slug: "dancing", label: "Dancing", emoji: "💃", category: "social" },
  { slug: "pottery", label: "Pottery", emoji: "🏺", category: "arts" },
  { slug: "surfing", label: "Surfing", emoji: "🏄", category: "outdoors" },
  { slug: "journaling", label: "Journaling", emoji: "📓", category: "wellness" },
  { slug: "wine", label: "Wine", emoji: "🍷", category: "food" },
];

export const VIBE_TAGS = [
  "calm",
  "adventurous",
  "creative",
  "ambitious",
  "spontaneous",
  "thoughtful",
  "playful",
  "grounded",
  "curious",
  "warm",
  "night-owl",
  "early-bird",
];

export const interestBySlug = (slug: string) =>
  INTERESTS.find((i) => i.slug === slug);

/* ───────────────────────── The current user ───────────────────────── */
export const ME: Profile = {
  id: "me",
  username: "you",
  displayName: "You",
  age: 24,
  bio: "Chasing good light, better coffee, and people who build things.",
  avatar: face(13),
  photos: [scene("me-1"), scene("me-2")],
  interests: ["coffee", "gym", "photography", "startups", "running", "vinyl"],
  vibeTags: ["ambitious", "creative", "warm", "early-bird"],
  lifestyle: { sleep: "early", work: "founder", social: "balanced", pace: "fast" },
  city: "San Francisco",
  distanceKm: 0,
  communities: ["founders", "film-photo", "run-club"],
};

/* ───────────────────────── Discovery profiles ───────────────────────── */
export const PROFILES: Profile[] = [
  {
    id: "p1",
    username: "maya",
    displayName: "Maya",
    age: 25,
    bio: "Film photographer + matcha enthusiast. Looking for golden-hour walk buddies. 🌅",
    avatar: face(5),
    photos: [scene("maya-1"), scene("maya-2"), scene("maya-3")],
    interests: ["photography", "matcha", "coffee", "reading", "travel"],
    vibeTags: ["creative", "calm", "thoughtful", "early-bird"],
    lifestyle: { sleep: "early", work: "designer", social: "intimate", pace: "calm" },
    city: "San Francisco",
    distanceKm: 3,
    communities: ["film-photo", "matcha-club"],
  },
  {
    id: "p2",
    username: "leo",
    displayName: "Leo",
    age: 27,
    bio: "Second-time founder. 6am runs, late-night code. Let's get a coffee and fix something.",
    avatar: face(12),
    photos: [scene("leo-1"), scene("leo-2")],
    interests: ["startups", "running", "coffee", "gym", "reading"],
    vibeTags: ["ambitious", "early-bird", "grounded", "curious"],
    lifestyle: { sleep: "early", work: "founder", social: "balanced", pace: "fast" },
    city: "San Francisco",
    distanceKm: 5,
    communities: ["founders", "run-club"],
  },
  {
    id: "p3",
    username: "aria",
    displayName: "Aria",
    age: 23,
    bio: "Vinyl collector, plant mom, weekend hiker. I will talk your ear off about analog synths.",
    avatar: face(20),
    photos: [scene("aria-1"), scene("aria-2"), scene("aria-3")],
    interests: ["vinyl", "music", "hiking", "coffee", "design"],
    vibeTags: ["creative", "playful", "warm", "spontaneous"],
    lifestyle: { sleep: "night", work: "artist", social: "outgoing", pace: "balanced" },
    city: "Oakland",
    distanceKm: 11,
    communities: ["film-photo", "vinyl-heads"],
  },
  {
    id: "p4",
    username: "noah",
    displayName: "Noah",
    age: 28,
    bio: "Cyclist + amateur chef. I host Sunday pasta nights. Bring wine, leave a friend.",
    avatar: face(15),
    photos: [scene("noah-1"), scene("noah-2")],
    interests: ["cycling", "cooking", "wine", "travel", "music"],
    vibeTags: ["warm", "grounded", "playful", "curious"],
    lifestyle: { sleep: "early", work: "engineer", social: "outgoing", pace: "balanced" },
    city: "San Francisco",
    distanceKm: 7,
    communities: ["supper-club", "cycle-sf"],
  },
  {
    id: "p5",
    username: "zoe",
    displayName: "Zoe",
    age: 24,
    bio: "Yoga teacher in training. Journaling, matcha, slow mornings. Find me at the studio. 🧘‍♀️",
    avatar: face(9),
    photos: [scene("zoe-1"), scene("zoe-2")],
    interests: ["yoga", "matcha", "journaling", "reading", "coffee"],
    vibeTags: ["calm", "thoughtful", "grounded", "warm"],
    lifestyle: { sleep: "early", work: "wellness", social: "intimate", pace: "calm" },
    city: "Berkeley",
    distanceKm: 14,
    communities: ["matcha-club", "mindful"],
  },
  {
    id: "p6",
    username: "kai",
    displayName: "Kai",
    age: 26,
    bio: "Product designer who surfs at dawn. Building a tiny app on the side. Always down for tacos.",
    avatar: face(33),
    photos: [scene("kai-1"), scene("kai-2"), scene("kai-3")],
    interests: ["design", "surfing", "startups", "photography", "coffee"],
    vibeTags: ["adventurous", "creative", "ambitious", "spontaneous"],
    lifestyle: { sleep: "early", work: "designer", social: "balanced", pace: "fast" },
    city: "San Francisco",
    distanceKm: 4,
    communities: ["founders", "film-photo"],
  },
  {
    id: "p7",
    username: "ivy",
    displayName: "Ivy",
    age: 25,
    bio: "Pottery studio regular + film nerd. I rate cafés by their natural light. ✨",
    avatar: face(24),
    photos: [scene("ivy-1"), scene("ivy-2")],
    interests: ["pottery", "film", "coffee", "design", "reading"],
    vibeTags: ["creative", "calm", "curious", "thoughtful"],
    lifestyle: { sleep: "night", work: "artist", social: "intimate", pace: "calm" },
    city: "San Francisco",
    distanceKm: 6,
    communities: ["film-photo", "makers"],
  },
  {
    id: "p8",
    username: "theo",
    displayName: "Theo",
    age: 29,
    bio: "Marathoner, espresso obsessive, weekend DJ. Looking for a running crew + gig buddies.",
    avatar: face(11),
    photos: [scene("theo-1"), scene("theo-2")],
    interests: ["running", "coffee", "music", "vinyl", "gym"],
    vibeTags: ["ambitious", "playful", "early-bird", "warm"],
    lifestyle: { sleep: "early", work: "engineer", social: "outgoing", pace: "fast" },
    city: "San Francisco",
    distanceKm: 8,
    communities: ["run-club", "vinyl-heads"],
  },
  {
    id: "p9",
    username: "luna",
    displayName: "Luna",
    age: 23,
    bio: "Travel writer between trips. Currently learning film photography. Tell me your favorite city.",
    avatar: face(45),
    photos: [scene("luna-1"), scene("luna-2"), scene("luna-3")],
    interests: ["travel", "photography", "reading", "coffee", "dancing"],
    vibeTags: ["adventurous", "curious", "spontaneous", "warm"],
    lifestyle: { sleep: "night", work: "writer", social: "outgoing", pace: "balanced" },
    city: "San Francisco",
    distanceKm: 9,
    communities: ["film-photo", "wanderers"],
  },
  {
    id: "p10",
    username: "sam",
    displayName: "Sam",
    age: 27,
    bio: "Indie hacker. Gym at 6, ships at midnight. Coffee walks > meetings.",
    avatar: face(60),
    photos: [scene("sam-1"), scene("sam-2")],
    interests: ["startups", "gym", "coffee", "gaming", "reading"],
    vibeTags: ["ambitious", "grounded", "curious", "early-bird"],
    lifestyle: { sleep: "early", work: "founder", social: "balanced", pace: "fast" },
    city: "San Francisco",
    distanceKm: 2,
    communities: ["founders", "run-club"],
  },
];

export const profileById = (id: string): Profile =>
  id === "me" ? ME : PROFILES.find((p) => p.id === id) ?? PROFILES[0];

/* ── Profile prompts (personality discovery, not résumé bios) ── */
export type Prompt = { q: string; a: string };

const PROMPTS: Record<string, Prompt[]> = {
  me: [
    { q: "A perfect Saturday is…", a: "Sunrise run, the year's best flat white, then building something with friends." },
    { q: "You'll find me at…", a: "The corner table with the best light, laptop open, third coffee in." },
  ],
  p1: [
    { q: "The way to my heart is…", a: "Show me a café with golden 4pm light and I'm yours (platonically!)." },
    { q: "My most-used app is…", a: "My light meter. Everything else is just for sharing the photos." },
    { q: "We'll get along if…", a: "You don't mind stopping every 10 steps for 'just one more shot.'" },
  ],
  p2: [
    { q: "My simple pleasures…", a: "6am miles before the city wakes up. Empty streets, full head." },
    { q: "I'm currently obsessed with…", a: "Negative splits and the espresso afterward. In that order." },
  ],
  p3: [
    { q: "Two truths and a vibe…", a: "I own 400 records, I've never been on time, and my plants are thriving." },
    { q: "Let's debate…", a: "Whether analog synths sound warmer. (They do. Fight me gently.)" },
  ],
  p4: [
    { q: "I'll teach you…", a: "How to make pasta from scratch. You bring the wine, I bring the chaos." },
    { q: "A green flag is…", a: "Showing up to my Sunday dinner with a stranger who becomes a friend." },
  ],
  p5: [
    { q: "My love language is…", a: "Making you a matcha and leaving you alone to read. Bliss." },
    { q: "I feel most myself when…", a: "On the mat at 6am, before the day asks anything of me." },
  ],
  p6: [
    { q: "Dawn or dusk?", a: "Dawn, always. Glassy waves, nobody out, the whole ocean to think." },
    { q: "I'm building…", a: "A tiny app, a calmer routine, and a better backhand. Mixed results." },
  ],
  p7: [
    { q: "My happy place…", a: "Elbow-deep in clay with a film playing in the background." },
    { q: "Rate my taste…", a: "I judge every café by its natural light. Currently undefeated." },
  ],
  p8: [
    { q: "Catch me…", a: "Mid-marathon or mid-DJ-set. Somehow both this weekend." },
    { q: "We should…", a: "Start a run crew that ends every Sunday at a record shop." },
  ],
  p9: [
    { q: "Last trip ruined me for…", a: "Normal coffee. Lisbon set a bar I can't unsee." },
    { q: "Tell me…", a: "Your favorite city and the one thing I have to eat there." },
  ],
  p10: [
    { q: "My toxic trait is…", a: "Gym at 6, ship at midnight, swear I'll sleep 'next week.'" },
    { q: "Best first hang…", a: "A long coffee walk with no agenda. Meetings are where ideas go to die." },
  ],
};

export const promptsFor = (id: string): Prompt[] => PROMPTS[id] ?? [];

/** Photo set for immersive profiles: their face first, then lifestyle shots. */
export const photosFor = (profile: Profile): string[] => {
  const extra = profile.photos.filter((p) => p && !p.startsWith("https://i.pravatar"));
  return [profile.avatar, ...extra];
};

/* Personality-driven photo prompts (the "social scrapbook" labels). */
const PHOTO_PROMPTS = [
  "this is me ✨",
  "my favorite weekend vibe",
  "something i genuinely love doing",
  "my comfort place",
  "a random moment that feels like me",
  "what my Sundays look like",
];

export const profilePhotos = (profile: Profile): { src: string; prompt: string }[] =>
  photosFor(profile).map((src, i) => ({ src, prompt: PHOTO_PROMPTS[i % PHOTO_PROMPTS.length] }));

/* Favorite places, derived from interests (feels lived-in, not résumé-y). */
const PLACE_BY_INTEREST: Record<string, string> = {
  coffee: "☕ Réveille Coffee",
  matcha: "🍵 Stonemill Matcha",
  gym: "🏋️ Equinox SoMa",
  running: "🏃 Crissy Field",
  reading: "📚 Green Apple Books",
  photography: "📷 Legion of Honor",
  vinyl: "🎵 Amoeba Records",
  music: "🎶 The Independent",
  hiking: "🥾 Lands End Trail",
  cycling: "🚲 the Marina loop",
  cooking: "🍳 the Ferry Building",
  surfing: "🏄 Ocean Beach",
  yoga: "🧘 Love Story Yoga",
  design: "🎨 SFMOMA",
  film: "🎬 the Roxie",
  travel: "✈️ anywhere with a runway",
  startups: "🚀 a SoMa co-work",
  gaming: "🎮 home setup",
  pottery: "🏺 the clay studio",
  journaling: "📓 Dolores Park",
  wine: "🍷 a Hayes Valley bar",
  dancing: "💃 a warehouse set",
};

export const favoritePlacesFor = (profile: Profile): string[] =>
  profile.interests
    .map((s) => PLACE_BY_INTEREST[s])
    .filter(Boolean)
    .slice(0, 5);

/* Lifestyle → friendly "how they live" cards (not a résumé). */
export const lifestyleCards = (profile: Profile): { emoji: string; label: string }[] => {
  const l = profile.lifestyle;
  const out: { emoji: string; label: string }[] = [];
  if (l.sleep) out.push(l.sleep === "early" ? { emoji: "🌅", label: "Early riser" } : { emoji: "🌙", label: "Night owl" });
  if (l.work) {
    const work: Record<string, { emoji: string; label: string }> = {
      founder: { emoji: "🚀", label: "Founder" },
      designer: { emoji: "🎨", label: "Designer" },
      engineer: { emoji: "💻", label: "Engineer" },
      artist: { emoji: "🖌️", label: "Artist" },
      writer: { emoji: "✍️", label: "Writer" },
      wellness: { emoji: "🧘", label: "Wellness" },
    };
    if (work[l.work]) out.push(work[l.work]);
  }
  if (l.social) {
    const social: Record<string, { emoji: string; label: string }> = {
      intimate: { emoji: "☕", label: "Small circles" },
      balanced: { emoji: "🦋", label: "Balanced social" },
      outgoing: { emoji: "🎉", label: "Social butterfly" },
    };
    if (social[l.social]) out.push(social[l.social]);
  }
  if (l.pace) {
    const pace: Record<string, { emoji: string; label: string }> = {
      calm: { emoji: "🌿", label: "Calm pace" },
      balanced: { emoji: "⚖️", label: "Balanced" },
      fast: { emoji: "⚡", label: "Fast-paced" },
    };
    if (pace[l.pace]) out.push(pace[l.pace]);
  }
  return out;
};

/* ── Per-profile activity timeline (so any profile reads as a lifestyle) ── */
const INTEREST_ACTIVITY: Record<string, ActivityTag> = {
  running: "run",
  gym: "gym",
  coffee: "cafe",
  matcha: "cafe",
  cooking: "cafe",
  wine: "cafe",
  reading: "reading",
  journaling: "reading",
  travel: "travel",
  music: "music",
  vinyl: "music",
  dancing: "music",
  design: "art",
  pottery: "art",
  photography: "art",
  film: "art",
  startups: "work",
  gaming: "work",
  hiking: "walk",
  cycling: "walk",
  surfing: "walk",
  yoga: "walk",
};

const TIMELINE_CAPTIONS: Record<ActivityTag, string[]> = {
  run: ["Easy miles before the world woke up. 🏃", "Tempo day — legs hated it, heart loved it."],
  gym: ["Leg day. Sending my regards to tomorrow-me.", "Quick lift to reset the brain. 🏋️"],
  cafe: ["Found my new favorite corner table. ☕️", "Flat white and a slow start to the day."],
  reading: ["A few pages in the sun. 📚", "Couldn't put this one down today."],
  travel: ["New city, same camera. ✈️", "Got lost on purpose. Best decision all week."],
  music: ["Found a record I can't stop spinning. 🎵", "Live set tonight — ears still ringing."],
  art: ["Studio afternoon, well spent. 🎨", "Made a mess, made a thing. Worth it."],
  work: ["Deep work, notifications off. 💻", "Shipped something small but real today."],
  walk: ["Golden hour wander. 🌅", "Cleared my head by the water."],
};

/** Deterministic lifestyle timeline for any profile, built from their interests. */
export function timelineFor(profile: Profile): Post[] {
  const tags = profile.interests
    .slice(0, 6)
    .map((s) => INTEREST_ACTIVITY[s] ?? "walk");
  return tags.map((tag, i) => ({
    id: `tl-${profile.id}-${i}`,
    authorId: profile.id,
    caption: TIMELINE_CAPTIONS[tag][i % TIMELINE_CAPTIONS[tag].length],
    image: scene(`tl-${profile.id}-${i}`, 800, i % 3 === 0 ? 1000 : 800),
    activityTag: tag,
    location: profile.city,
    createdAt: mins((i + 1) * 220),
    reactions: 12 + ((i * 7 + profile.id.length * 3) % 44),
    comments: (i * 3 + 1) % 9,
  }));
}

/* ───────────────────────── Activity feed ───────────────────────── */
const mins = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

export const POSTS: Post[] = [
  {
    id: "po1",
    authorId: "p2",
    caption: "5:48 splits this morning. The fog made it feel cinematic. Who's in for Saturday? 🏃",
    image: scene("post-run", 1000, 800),
    activityTag: "run",
    location: "Embarcadero, SF",
    createdAt: mins(18),
    reactions: 34,
    comments: 6,
  },
  {
    id: "po-me-1",
    authorId: "me",
    caption: "Morning espresso + outlining the next build. This corner table is my office now. ☕️",
    image: scene("me-cafe", 1000, 800),
    activityTag: "cafe",
    location: "Réveille Coffee, SF",
    createdAt: mins(35),
    reactions: 22,
    comments: 3,
  },
  {
    id: "po2",
    authorId: "p1",
    caption: "Found the prettiest little café in the Mission. The light at 4pm is unreal. ☕️📷",
    image: scene("post-cafe", 1000, 800),
    activityTag: "cafe",
    location: "Mission District, SF",
    createdAt: mins(52),
    reactions: 58,
    reactedByMe: true,
    comments: 11,
  },
  {
    id: "po3",
    authorId: "p6",
    caption: "Dawn patrol. Glassy and empty. Best meeting prep there is. 🌊",
    image: scene("post-surf", 1000, 800),
    activityTag: "walk",
    location: "Ocean Beach, SF",
    createdAt: mins(140),
    reactions: 41,
    comments: 4,
  },
  {
    id: "po-me-2",
    authorId: "me",
    caption: "Easy 6k to shake off the week. Golden hour did all the work.",
    image: scene("me-run", 1000, 800),
    activityTag: "run",
    location: "Crissy Field, SF",
    createdAt: mins(180),
    reactions: 30,
    comments: 2,
  },
  {
    id: "po4",
    authorId: "p3",
    caption: "New record day at the shop. This pressing sounds like warm honey. 🎵",
    image: scene("post-vinyl", 1000, 800),
    activityTag: "music",
    location: "Stranded Records, Oakland",
    createdAt: mins(220),
    reactions: 27,
    comments: 3,
  },
  {
    id: "po-me-3",
    authorId: "me",
    caption: "Finally finishing this one. 'The Creative Act' is quietly rewiring how I work.",
    image: scene("me-reading", 1000, 800),
    activityTag: "reading",
    location: "Dolores Park, SF",
    createdAt: mins(300),
    reactions: 41,
    comments: 7,
  },
  {
    id: "po5",
    authorId: "p5",
    caption: "Slow morning. Matcha, a few pages, no phone. Highly recommend.",
    image: scene("post-matcha", 1000, 800),
    activityTag: "reading",
    location: "Berkeley",
    createdAt: mins(360),
    reactions: 49,
    comments: 8,
  },
  {
    id: "po-me-4",
    authorId: "me",
    caption: "Late-night flow state. Shipped the new onboarding — ten taps, zero friction. 💻",
    image: scene("me-work", 1000, 800),
    activityTag: "work",
    location: "SoMa, SF",
    createdAt: mins(430),
    reactions: 38,
    comments: 5,
  },
  {
    id: "po6",
    authorId: "p10",
    caption: "Shipped the thing at 1am, gym at 6. Balance is a myth but the espresso helps.",
    image: scene("post-work", 1000, 800),
    activityTag: "gym",
    location: "SoMa, SF",
    createdAt: mins(500),
    reactions: 31,
    comments: 5,
  },
  {
    id: "po7",
    authorId: "p9",
    caption: "First roll back from Lisbon. Shot it all on Portra. Already homesick for those tiles. ✈️",
    image: scene("post-travel", 1000, 800),
    activityTag: "travel",
    location: "Alfama, Lisbon",
    createdAt: mins(640),
    reactions: 64,
    comments: 12,
  },
  {
    id: "po8",
    authorId: "p7",
    caption: "Studio afternoon. Three bowls, two survived the kiln. Calling it a win. 🏺",
    image: scene("post-art", 1000, 800),
    activityTag: "art",
    location: "Makers Studio, SF",
    createdAt: mins(720),
    reactions: 36,
    comments: 6,
  },
];

/* ───────────────────────── Communities ───────────────────────── */
export const COMMUNITIES: Community[] = [
  {
    slug: "founders",
    name: "SF Founders",
    description: "Builders shipping things. Weekly coffee co-working + demo nights.",
    emoji: "🚀",
    cover: scene("c-founders", 1000, 600),
    memberCount: 1284,
    joined: true,
  },
  {
    slug: "film-photo",
    name: "Film Photographers",
    description: "35mm souls. Photo walks, darkroom days, and gear talk.",
    emoji: "📷",
    cover: scene("c-film", 1000, 600),
    memberCount: 842,
    joined: true,
  },
  {
    slug: "run-club",
    name: "Sunrise Run Club",
    description: "We run before the city wakes up. All paces, zero ego.",
    emoji: "🏃",
    cover: scene("c-run", 1000, 600),
    memberCount: 967,
    joined: true,
  },
  {
    slug: "matcha-club",
    name: "Matcha Society",
    description: "Slow mornings, good ceramics, the perfect whisk.",
    emoji: "🍵",
    cover: scene("c-matcha", 1000, 600),
    memberCount: 531,
  },
  {
    slug: "vinyl-heads",
    name: "Vinyl Heads",
    description: "Crate digging, listening parties, and analog warmth.",
    emoji: "🎵",
    cover: scene("c-vinyl", 1000, 600),
    memberCount: 688,
  },
  {
    slug: "supper-club",
    name: "Supper Club",
    description: "Strangers + a long table + something delicious. Monthly dinners.",
    emoji: "🍝",
    cover: scene("c-supper", 1000, 600),
    memberCount: 412,
  },
];

export const communityBySlug = (slug: string) =>
  COMMUNITIES.find((c) => c.slug === slug);

/* ───────────────────────── Events / meetups ───────────────────────── */
const hours = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString();

export const EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "Golden Hour Photo Walk",
    description: "Bring any camera. We'll wander the Embarcadero chasing the best light, then coffee.",
    cover: scene("e-photo", 1000, 600),
    activityTag: "walk",
    location: "Ferry Building, SF",
    startsAt: hours(28),
    hostId: "p1",
    communitySlug: "film-photo",
    capacity: 20,
    goingCount: 12,
  },
  {
    id: "e2",
    title: "Saturday Sunrise 5K",
    description: "Easy social pace along the bay. Stretch + espresso after. All levels welcome.",
    cover: scene("e-run", 1000, 600),
    activityTag: "run",
    location: "Crissy Field",
    startsAt: hours(34),
    hostId: "p2",
    communitySlug: "run-club",
    capacity: 40,
    goingCount: 23,
    rsvp: "going",
  },
  {
    id: "e3",
    title: "Founders Co-working + Demos",
    description: "Heads-down morning, then lightning demos at noon. Bring what you're building.",
    cover: scene("e-founders", 1000, 600),
    activityTag: "work",
    location: "Mission Co-work Loft",
    startsAt: hours(50),
    hostId: "p10",
    communitySlug: "founders",
    capacity: 30,
    goingCount: 18,
  },
  {
    id: "e4",
    title: "Vinyl Listening Night",
    description: "Bring one record that means something. We listen, we talk, we discover.",
    cover: scene("e-vinyl", 1000, 600),
    activityTag: "music",
    location: "Aria's place, Oakland",
    startsAt: hours(72),
    hostId: "p3",
    communitySlug: "vinyl-heads",
    capacity: 12,
    goingCount: 9,
    rsvp: "interested",
  },
];

export const eventById = (id: string) => EVENTS.find((e) => e.id === id);

/* ───────────────────────── Chat ───────────────────────── */
export const CONVERSATIONS: Conversation[] = [
  {
    id: "conv1",
    withId: "p1",
    compatibility: 92,
    lastMessage: "yes!! that café by the water, 4pm?",
    lastAt: mins(7),
    unread: 2,
  },
  {
    id: "conv2",
    withId: "p2",
    compatibility: 88,
    lastMessage: "see you at Crissy for the sunrise run 🏃",
    lastAt: mins(40),
    unread: 0,
  },
  {
    id: "conv3",
    withId: "p6",
    compatibility: 85,
    lastMessage: "tacos after the surf? I know a spot",
    lastAt: mins(190),
    unread: 0,
  },
];

export const MESSAGES: Record<string, Message[]> = {
  conv1: [
    { id: "m1", conversationId: "conv1", senderId: "p1", body: "heyy we matched on photography + matcha, that's basically destiny 😄", createdAt: mins(60) },
    { id: "m2", conversationId: "conv1", senderId: "me", body: "ha clearly. do you shoot film?", createdAt: mins(55) },
    { id: "m3", conversationId: "conv1", senderId: "p1", body: "always. portra 400 is my whole personality", createdAt: mins(50) },
    { id: "m4", conversationId: "conv1", senderId: "me", body: "perfect. there's a photo walk this week, want to go?", createdAt: mins(20) },
    { id: "m5", conversationId: "conv1", senderId: "p1", body: "yes!! that café by the water, 4pm?", createdAt: mins(7) },
  ],
  conv2: [
    { id: "m6", conversationId: "conv2", senderId: "p2", body: "you're a founder too? we should co-work", createdAt: mins(120) },
    { id: "m7", conversationId: "conv2", senderId: "me", body: "100%. also heard you run at sunrise", createdAt: mins(90) },
    { id: "m8", conversationId: "conv2", senderId: "p2", body: "see you at Crissy for the sunrise run 🏃", createdAt: mins(40) },
  ],
  conv3: [
    { id: "m9", conversationId: "conv3", senderId: "p6", body: "designer + surfer, we'd get along", createdAt: mins(240) },
    { id: "m10", conversationId: "conv3", senderId: "p6", body: "tacos after the surf? I know a spot", createdAt: mins(190) },
  ],
};
