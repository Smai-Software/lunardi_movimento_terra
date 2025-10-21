import { headers } from "next/headers";
import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/lib/auth";

export const actionClient = createSafeActionClient();

export const actionClientWithAuth = actionClient.use(async ({ next }) => {
  const headersList = await headers();
  const session = await auth.api.getSession({
    query: {
      disableCookieCache: true,
    },
    headers: headersList,
  });

  if (!session || !session.user?.id) {
    throw new Error("Sessione non valida. Effettuare nuovamente il login.");
  }

  return next({ ctx: { userId: session.user.id, headers: headersList } });
});
