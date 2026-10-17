"use server";

import { redirect } from "next/navigation";
import {
  signupLocal,
  loginLocal,
  clearSession,
  setLocalOnboarded,
} from "@/lib/auth/local";

export async function signupAction(input: { email: string; password: string; name: string }) {
  return signupLocal(input.email, input.password, input.name);
}

export async function loginAction(input: { email: string; password: string }) {
  return loginLocal(input.email, input.password);
}

export async function localSignOut() {
  await clearSession();
  redirect("/");
}

export async function saveLocalOnboarding(profile: Record<string, unknown>) {
  return setLocalOnboarded(profile);
}
