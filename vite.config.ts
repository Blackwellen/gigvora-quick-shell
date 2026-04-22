import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: [
      // Order matters: more-specific subpath alias FIRST so `@gigvora/sdk/foo`
      // resolves to packages/sdk/src/foo.ts, then the bare alias for the
      // root SDK entry. Without the directory alias Vite was treating the
      // bare alias as a file and trying to read `index.ts/foo` as a child.
      { find: /^@gigvora\/sdk\/(.*)$/, replacement: path.resolve(__dirname, "./packages/sdk/src/$1.ts") },
      { find: "@gigvora/sdk", replacement: path.resolve(__dirname, "./packages/sdk/src/index.ts") },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
