import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreDependencies: ["eslint-config-next"],
  ignore: [
    "src/components/ui/**",
    "src/server/db/schema/auth.ts",
    "src/server/better-auth/**",
  ],
};

export default config;
