import type { MetadataRoute } from "next";

/**
 * PWA manifest — makes Viby installable on phones ("Add to Home Screen")
 * and provides the icons/splash metadata Capacitor + the stores reuse.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Viby — find your people",
    short_name: "Viby",
    description:
      "Make friends and find your people through shared hobbies and lifestyle. A premium social-discovery app.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#fff8fb",
    categories: ["social", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
