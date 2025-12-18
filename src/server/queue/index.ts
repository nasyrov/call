import { Queue } from "bullmq";

import { env } from "~/env";

export const transcriptionQueue = new Queue("transcription", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});
