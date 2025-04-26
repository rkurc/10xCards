// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [
    react(),
    sitemap(),
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
  ],
  server: { port: 3000 },
  vite: {
    // Remove the tailwindcss() call since it's not imported and not needed
    plugins: [], 
    css: {
      preprocessorOptions: {
        scss: {
          includePaths: ["src/styles"],
        },
      },
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
