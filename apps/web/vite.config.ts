import { createHelbaronAppViteConfig } from "@helbaron/scripts/vite";
import { defineConfig, mergeConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const appConfig = createHelbaronAppViteConfig({
  browserNodeStubUrl: new URL("../../packages/app/src/lib/browser-node-stub.ts", import.meta.url),
  packageJsonUrl: new URL("./package.json", import.meta.url)
});

export default defineConfig((environment) => mergeConfig(appConfig(environment), {
  plugins: [VitePWA({
    injectRegister: "script",
    registerType: "prompt",
    manifest: {
      id: "/",
      name: "Helbaron",
      short_name: "Helbaron",
      description: "محرر Markdown عربي يعمل محلياً",
      lang: "ar",
      dir: "rtl",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    },
    workbox: {
      clientsClaim: false,
      skipWaiting: false,
      globPatterns: ["**/*.{html,js,css,woff2,png,svg,ico}"],
      // Mermaid's renderer exceeds Workbox's default 2 MiB precache limit.
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      navigateFallbackAllowlist: [/^\/(?:\?.*)?$/]
    }
  })]
}));
