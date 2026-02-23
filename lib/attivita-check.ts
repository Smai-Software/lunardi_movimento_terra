import type { PrismaClient } from "@/generated/prisma";

type SessionLike = { user: { id: string; role?: string | null } };

/**
 * Se l'utente non è admin, imposta is_checked=false sull'attività (dopo modifica a interazioni/trasporti/assenze).
 */
export async function markAttivitaUncheckedIfNonAdmin(
  client: PrismaClient,
  attivitaId: number,
  session: SessionLike,
): Promise<void> {
  if (session.user.role === "admin") return;
  await client.attivita.update({
    where: { id: attivitaId },
    data: {
      is_checked: false,
      last_update_at: new Date(),
      last_update_by: session.user.id,
    },
  });
}
