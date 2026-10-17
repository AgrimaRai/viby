import { cn } from "@/lib/utils";

/**
 * Viby's signature identity silhouette — intentionally NOT a circle.
 * A soft squircle with one crisp accent corner, so avatars read as little
 * "identity tiles" instead of generic Instagram circles. Reused by layered
 * tiles elsewhere (profile header polaroid, etc.).
 */
export const AVATAR_RADIUS = "44% 44% 44% 14%";

export function Avatar({
  src,
  alt,
  size = 44,
  ring,
  className,
  style,
}: {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden bg-lilac", className)}
      style={{
        width: size,
        height: size,
        borderRadius: AVATAR_RADIUS,
        boxShadow: ring
          ? "0 0 0 2.5px #fff, 0 12px 26px -12px rgba(255,111,181,0.65)"
          : "0 6px 16px -10px rgba(255,111,181,0.4)",
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </span>
  );
}
