import { GradientBlobs } from "@/components/common/GradientBlobs";

/**
 * On desktop, renders the app inside a centered phone-sized frame so the
 * mobile-first product always looks intentional. On mobile it's full-bleed.
 */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full bg-aurora">
      <GradientBlobs />
      <div className="flex min-h-dvh items-center justify-center sm:py-8">
        <div className="relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-aurora sm:h-[900px] sm:max-h-[92vh] sm:rounded-[44px] sm:border sm:border-white/70 sm:shadow-[0_40px_120px_-30px_rgba(120,90,210,0.45)]">
          {children}
        </div>
      </div>
    </div>
  );
}
