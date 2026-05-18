import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    target: "esnext",
    lib: {
      entry: resolve(__dirname, "src/mermaid-bundle/index.ts"),
      name: "MermaidBundle",
      formats: ["iife"],
      fileName: () => "mermaid-bundle.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
