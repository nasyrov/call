import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/worker/index.ts"],
  format: ["cjs"],
  target: "node22",
  outDir: ".next/worker",
  clean: true,
  sourcemap: true,
  // Bundle all dependencies for standalone execution
  noExternal: [/.*/],
  platform: "node",
  // Handle path aliases
  esbuildOptions(options) {
    options.alias = {
      "~": "./src",
    };
  },
});
