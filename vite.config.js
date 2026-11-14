import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { pwaPlugin } from "./scripts/pwa.mjs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const publicUrl = (
    env.VITE_PUBLIC_URL || "https://vasfplhsm.github.io/titipandoa"
  ).replace(/\/$/, "");
  return {
    base: "./",
    plugins: [
      {
        name: "social-preview-url",
        transformIndexHtml: {
          order: "pre",
          handler: (html) => html.replaceAll("%VITE_PUBLIC_URL%", publicUrl),
        },
      },
      tailwindcss(),
      pwaPlugin(),
      react(),
    ],
  };
});
