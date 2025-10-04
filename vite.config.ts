import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Unocss from "unocss/vite";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      dts: "src/auto-imports.d.ts",
      imports: ["vue", "vue-router", "pinia"],
    }),
    Components({
      dts: "src/components.d.ts",
    }),
    Unocss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
});
