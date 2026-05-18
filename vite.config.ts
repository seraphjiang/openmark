import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
    lib: {
      entry: resolve(__dirname, "src/content/index.ts"),
      name: "openmark",
      formats: ["iife"],
      fileName: () => "content.js",
    },
    rollupOptions: {
      // Exclude mermaid from bundle — loaded from CDN at runtime
      external: ["mermaid"],
      output: {
        inlineDynamicImports: true,
        globals: {
          mermaid: "mermaid",
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
