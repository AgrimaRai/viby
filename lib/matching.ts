import type { Profile } from "./types";

/**
 * Viby compatibility scoring.
 *
 * score = 0.40·hobbyOverlap + 0.20·vibeAffinity + 0.15·lifestyleMatch
 *       + 0.15·proximity     + 0.10·communityOverlap
 *
 * The same function runs in the demo (mock data) and is intended to run
 * server-side / in a Supabase edge function against real rows.
 */

function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  A.forEach((x) => B.has(x) && inter++);
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function proximityScore(distanceKm: number, maxRadius = 40): number {
  return Math.max(0, Math.min(1, 1 - distanceKm / maxRadius));
}

function lifestyleMatch(a: Profile, b: Profile): number {
  const keys: (keyof Profile["lifestyle"])[] = ["sleep", "work", "social", "pace"];
  let agree = 0;
  let total = 0;
  for (const k of keys) {
    const av = a.lifestyle[k];
    const bv = b.lifestyle[k];
    if (av && bv) {
      total++;
      if (av === bv) agree++;
    }
  }
  return total === 0 ? 0.5 : agree / total;
}

export type Breakdown = {
  hobbies: number;
  vibe: number;
  lifestyle: number;
  proximity: number;
  community: number;
};

export function compatibility(
  me: Profile,
  other: Profile,
): { score: number; breakdown: Breakdown; sharedInterests: string[] } {
  const hobbies = jaccard(me.interests, other.interests);
  const vibe = jaccard(me.vibeTags, other.vibeTags);
  const life = lifestyleMatch(me, other);
  const prox = proximityScore(other.distanceKm);
  const community = jaccard(me.communities, other.communities);

  const raw =
    0.4 * hobbies + 0.2 * vibe + 0.15 * life + 0.15 * prox + 0.1 * community;

  // Gentle curve so most surfaced candidates land in an aspirational 60-99 band.
  const score = Math.round(Math.min(99, 52 + raw * 60));

  const sharedInterests = me.interests.filter((i) => other.interests.includes(i));

  return {
    score,
    breakdown: {
      hobbies: Math.round(hobbies * 100),
      vibe: Math.round(vibe * 100),
      lifestyle: Math.round(life * 100),
      proximity: Math.round(prox * 100),
      community: Math.round(community * 100),
    },
    sharedInterests,
  };
}

/** Rank candidates for the discovery deck, best-first, with light freshness jitter. */
export function rankCandidates(me: Profile, candidates: Profile[]): Profile[] {
  return [...candidates]
    .map((c, i) => ({
      c,
      // deterministic jitter by index so the deck feels alive but stays stable
      s: compatibility(me, c).score + ((i * 7) % 5) * 0.1,
    }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}
