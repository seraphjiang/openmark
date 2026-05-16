import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    target: "esnext",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        popup: resolve(__dirname, "src/popup/index.ts"),
        options: resolve(__dirname, "src/options/index.ts"),
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
