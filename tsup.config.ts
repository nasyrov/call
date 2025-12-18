import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/worker/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: ".next/worker",
  clean: true,
  sourcemap: true,
  // Output as .mjs to ensure Node.js treats it as ESM
  outExtension: () => ({ js: ".mjs" }),
  // Bundle all dependencies for standalone execution
  noExternal: [/.*/],
  // Handle path aliases
  esbuildOptions(options) {
    options.alias = {
      "~": "./src",
    };
  },
});
