import "server-only";
import { promises as fs } from "fs";
import path from "path";
import {
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";

/**
 * Local, database-backed auth for development — real signup/login you can test
 * with zero external services. Users persist to `.data/users.json`, passwords
 * are scrypt-hashed, and the session is a signed HTTP-only cookie.
 *
 * This is the fallback when Supabase isn't configured. For production, set the
 * Supabase env vars and the app switches to Supabase Auth automatically.
 * (Note: the file DB is for local/dev — serverless filesystems are ephemeral.)
 */

export type LocalUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  onboarded: boolean;
  profile?: Record<string, unknown>;
  createdAt: string;
};

const COOKIE = "viby_session";
const SECRET = process.env.LOCAL_AUTH_SECRET || "viby-dev-secret-change-me";
const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "users.json");

// ── DB ───────────────────────────────────────────────────
async function readDB(): Promise<LocalUser[]> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}
async function writeDB(users: LocalUser[]) {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2), "utf8");
}

// ── Passwords ────────────────────────────────────────────
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = scryptSync(pw, salt, 64);
  const actual = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ── Session cookie (signed) ──────────────────────────────
function sign(id: string): string {
  const sig = createHmac("sha256", SECRET).update(id).digest("hex");
  return `${id}.${sig}`;
}
function unsign(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const id = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac("sha256", SECRET).update(id).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

async function setSession(id: string) {
  (await cookies()).set(COOKIE, sign(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}
export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

// ── Public API ───────────────────────────────────────────
export async function signupLocal(email: string, password: string, name: string) {
  email = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false as const, error: "Enter a valid email." };
  if (password.length < 6) return { ok: false as const, error: "Password must be at least 6 characters." };

  const users = await readDB();
  if (users.some((u) => u.email === email))
    return { ok: false as const, error: "That email already has an account — log in instead." };

  const user: LocalUser = {
    id: randomUUID(),
    email,
    name: name.trim() || email.split("@")[0],
    passwordHash: hashPassword(password),
    onboarded: false,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeDB(users);
  await setSession(user.id);
  return { ok: true as const, onboarded: false };
}

export async function loginLocal(email: string, password: string) {
  email = email.trim().toLowerCase();
  const users = await readDB();
  const user = users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash))
    return { ok: false as const, error: "Wrong email or password." };
  await setSession(user.id);
  return { ok: true as const, onboarded: user.onboarded };
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const id = unsign(token);
  if (!id) return null;
  const users = await readDB();
  return users.find((u) => u.id === id) ?? null;
}

export async function setLocalOnboarded(profile: Record<string, unknown>) {
  const current = await getLocalUser();
  if (!current) return { ok: false as const };
  const users = await readDB();
  const i = users.findIndex((u) => u.id === current.id);
  if (i === -1) return { ok: false as const };
  users[i] = {
    ...users[i],
    onboarded: true,
    name: (profile.displayName as string) || users[i].name,
    profile,
  };
  await writeDB(users);
  return { ok: true as const };
}
