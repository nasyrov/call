import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/worker/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: ".next/worker",
  clean: true,
  sourcemap: true,
  // Handle path aliases
  esbuildOptions(options) {
    options.alias = {
      "~": "./src",
    };
  },
});
