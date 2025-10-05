import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Unocss from "unocss/vite";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";

const projectRootDir = fileURLToPath(new URL(".", import.meta.url));
const quasarVariablesPath = fileURLToPath(
  new URL("./src/css/quasar-variables.sass", import.meta.url)
);

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    AutoImport({
      dts: "src/auto-imports.d.ts",
      imports: ["vue", "vue-router", "pinia"],
    }),
    Components({
      dts: "src/components.d.ts",
    }),
    Unocss(),
    quasar({
      sassVariables: quasarVariablesPath,
    }),
  ],
  css: {
    preprocessorOptions: {
      sass: {
        includePaths: [projectRootDir],
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
});
