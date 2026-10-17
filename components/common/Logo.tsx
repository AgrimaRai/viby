import { cn } from "@/lib/utils";

export function Logo({
  size = 28,
  withText = true,
  className,
}: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="relative grid place-items-center rounded-[30%] gradient-primary shadow-[0_8px_18px_-6px_rgba(255,111,181,0.8)]"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="#fff"
          style={{ width: size * 0.62, height: size * 0.62 }}
          aria-hidden
        >
          <path d="M50 10 C 55 40 60 45 90 50 C 60 55 55 60 50 90 C 45 60 40 55 10 50 C 40 45 45 40 50 10 Z" />
        </svg>
      </span>
      {withText && (
        <span
          className="font-display font-semibold tracking-tight text-ink"
          style={{ fontSize: size * 0.72 }}
        >
          Viby
        </span>
      )}
    </span>
  );
}
