/** Ambient floating gradient orbs that give the cream background depth. */
export function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-16 -top-10 h-64 w-64 rounded-full opacity-70 blur-3xl animate-[float_7s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #ffc2e0, transparent 70%)" }}
      />
      <div
        className="absolute -right-12 top-24 h-72 w-72 rounded-full opacity-60 blur-3xl animate-[float_9s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #ffd0e8, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-45 blur-3xl animate-[float_8s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #ffdcec, transparent 70%)" }}
      />
    </div>
  );
}
