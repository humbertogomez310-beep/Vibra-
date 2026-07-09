import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

const rawPort = process.env.PORT || "5173";
const port = Number(rawPort);

const basePath = process.env.BASE_PATH || "/Vibra-/";

export default defineConfig({
  base: basePath,
  server: {
    port,
    host: "0.0.0.0",
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'VIBRA PRO',
        short_name: 'VIBRA',
        description: 'Mood-driven music experience powered by VIBRA PRO.',
        start_url: '/Vibra-/',
        display: 'standalone',
        background_color: '#030712',
        theme_color: '#5b7dff',
        icons: [
          {
            src: '/Vibra-/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
