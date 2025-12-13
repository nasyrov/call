import { createServerActionProcedure } from "zsa";

import { getSession } from "~/server/better-auth/server";

export const authenticatedProcedure = createServerActionProcedure()
  .handler(async () => {
    const session = await getSession();

    if (!session) {
      throw new Error("Not authenticated");
    }

    return {
      user: session.user,
      session: session.session,
    };
  })
  .createServerAction();
