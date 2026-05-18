import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
        // Let Rollup naturally split mermaid into its own chunk
        manualChunks: (id) => {
          if (id.includes("node_modules/mermaid")) return "mermaid";
          if (id.includes("node_modules/katex")) return "katex";
          if (id.includes("node_modules/highlight.js")) return "highlight";
        },
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "public/*", dest: "." },
        { src: "src/popup/popup.html", dest: "." },
        { src: "src/options/options.html", dest: "." },
        { src: "src/content/styles/main.css", dest: "assets", rename: "content.css" },
      ],
    }),
  ],
});
