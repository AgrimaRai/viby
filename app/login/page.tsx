"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";
import { DeviceFrame } from "@/components/shell/DeviceFrame";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/supabase/config";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "email" | "otp">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Demo fallback (no Supabase configured): simulate the hop into onboarding.
  function finish() {
    setLoading(true);
    setTimeout(() => router.push("/onboarding"), 900);
  }

  async function signInGoogle() {
    if (!hasSupabase) return finish();
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function sendCode() {
    if (!hasSupabase) return setStep("otp");
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setStep("otp");
  }

  async function verify(token: string) {
    if (!hasSupabase) return finish();
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/discover");
  }

  function onCode(i: number, v: string) {
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((c) => c)) {
      const token = next.join("");
      setTimeout(() => (hasSupabase ? verify(token) : finish()), 150);
    }
  }

  return (
    <DeviceFrame>
      <div className="flex h-full flex-col px-7 pb-10 pt-14">
        <div className="flex items-center gap-3">
          {step !== "choose" && (
            <button
              onClick={() => setStep(step === "otp" ? "email" : "choose")}
              className="grid h-10 w-10 place-items-center rounded-full glass text-ink"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <Logo size={26} />
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === "choose" && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="font-display text-[32px] font-semibold leading-tight text-ink">
                  Welcome to Viby
                </h1>
                <p className="mt-2 text-ink-soft">
                  Let&apos;s get you in. It takes about a minute.
                </p>
                <div className="mt-9 space-y-3">
                  <Button variant="soft" size="lg" className="w-full" onClick={signInGoogle} disabled={loading}>
                    <GoogleMark />
                    Continue with Google
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    onClick={() => setStep("email")}
                  >
                    <Mail className="h-5 w-5" />
                    Continue with email
                  </Button>
                </div>
                <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
                  By continuing you agree to our Terms & Privacy. Viby is for
                  making friends and finding your people.
                </p>
              </motion.div>
            )}

            {step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="font-display text-[30px] font-semibold leading-tight text-ink">
                  What&apos;s your email?
                </h1>
                <p className="mt-2 text-ink-soft">
                  We&apos;ll send you a 6-digit code. No passwords ever.
                </p>
                <input
                  autoFocus
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-7 h-14 w-full rounded-2xl border border-white/70 bg-white/70 px-5 text-[16px] text-ink shadow-soft outline-none placeholder:text-ink-faint focus:border-lavender"
                />
                <Button
                  size="lg"
                  className="mt-4 w-full"
                  disabled={!email.includes("@") || loading}
                  onClick={sendCode}
                >
                  {loading ? "Sending…" : "Send code"}
                </Button>
                {error && <p className="mt-3 text-center text-sm text-blush-2">{error}</p>}
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="font-display text-[30px] font-semibold leading-tight text-ink">
                  Enter your code
                </h1>
                <p className="mt-2 text-ink-soft">
                  Sent to <span className="font-medium text-ink">{email || "your inbox"}</span>.
                  {hasSupabase ? " Check your inbox." : " Try any 6 digits."}
                </p>
                <div className="mt-7 flex justify-between gap-2">
                  {code.map((c, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputs.current[i] = el; }}
                      value={c}
                      autoFocus={i === 0}
                      inputMode="numeric"
                      maxLength={1}
                      onChange={(e) => onCode(i, e.target.value)}
                      className="h-14 w-12 rounded-2xl border border-white/70 bg-white/70 text-center text-2xl font-semibold text-ink shadow-soft outline-none focus:border-lavender"
                    />
                  ))}
                </div>
                <Button
                  size="lg"
                  className="mt-6 w-full"
                  onClick={() => (hasSupabase ? verify(code.join("")) : finish())}
                  disabled={loading || code.some((c) => !c)}
                >
                  {loading ? "Signing you in…" : "Verify"}
                </Button>
                {error && <p className="mt-3 text-center text-sm text-blush-2">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DeviceFrame>
  );
}
