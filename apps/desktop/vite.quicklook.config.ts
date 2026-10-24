import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  define: {
    __HELBARON_APP_VERSION__: JSON.stringify("quicklook"),
    __HELBARON_DEBUG__: JSON.stringify(false)
  },
  // WKWebView loads this page from the signed extension bundle. Inlining avoids file:// module
  // loading restrictions and also keeps the extension independent from the main Tauri assets.
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    emptyOutDir: true,
    outDir: "src-tauri/target/quicklook-renderer",
    rolldownOptions: {
      input: resolve(import.meta.dirname, "src/quicklook/index.html")
    }
  }
});
