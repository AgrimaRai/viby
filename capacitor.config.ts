import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wraps the deployed Viby web app in native Android/iOS shells.
 *
 * Because Viby uses the Next.js App Router (server components, server actions,
 * proxy.ts auth) it can't be statically exported — so the native app loads the
 * HOSTED build via `server.url`. Deploy to Vercel first, then point this there.
 */
const config: CapacitorConfig = {
  appId: "com.viby.app",
  appName: "Viby",
  webDir: "public", // unused when server.url is set, but required by the CLI
  backgroundColor: "#ffffff",
  server: {
    // 👇 set this to your deployed URL before `npx cap sync`
    url: "https://YOUR-VIBY-DOMAIN.com",
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },
  android: { backgroundColor: "#ffffff" },
  ios: { backgroundColor: "#ffffff", contentInset: "always" },
};

export default config;
