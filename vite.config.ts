import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  // games-site serves immutable releases from /game-assets/weather-command/<version>/.
  // Relative URLs keep the exact same build valid beneath any versioned prefix.
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
