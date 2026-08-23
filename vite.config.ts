// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Nitro (via the shared Lovable config) always falls back to the
  // `cloudflare-module` preset when no explicit preset is set — it does NOT
  // autodetect the deploy target from env vars. Vercel's build environment
  // sets `VERCEL=1`, so use that to opt into Nitro's `vercel` preset there;
  // every other build (local dev, Cloudflare) keeps the default.
  nitro: process.env.VERCEL ? { preset: "vercel" } : undefined,
});
