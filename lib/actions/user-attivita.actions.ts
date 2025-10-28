"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { actionClientWithAuth } from "@/lib/safe-action";

// --- CREA ATTIVITA CON INTERAZIONI (FOR USER) ---
export const createUserAttivitaWithInterazioni = actionClientWithAuth
  .inputSchema(
    z.object({
      date: z.string().min(1, "La data è obbligatoria"),
      interazioni: z
        .array(
          z.object({
            cantieri_id: z.number().min(1, "Il cantiere è obbligatorio"),
            mezzi_id: z.number().nullable().optional(),
            ore: z.number().min(0, "Le ore devono essere >= 0"),
            minuti: z
              .number()
              .min(0)
              .max(59, "I minuti devono essere tra 0 e 59"),
          }),
        )
        .min(1, "Almeno un'interazione è richiesta"),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
      attivitaId: z.number().optional(),
    }),
  )
  .action(async ({ parsedInput: { date, interazioni }, ctx: { userId } }) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create attivita record
        const attivita = await tx.attivita.create({
          data: {
            date: new Date(date),
            user_id: userId, // Use userId from session
            created_at: new Date(),
            last_update_at: new Date(),
            created_by: userId,
            last_update_by: userId,
            external_id: randomUUID(),
          },
        });

        // Create all interazioni records
        await tx.interazioni.createMany({
          data: interazioni.map((interazione) => ({
            ore: interazione.ore,
            minuti: interazione.minuti,
            tempo_totale: BigInt(
              (interazione.ore * 60 + interazione.minuti) * 60000,
            ),
            user_id: userId, // Use userId from session
            mezzi_id: interazione.mezzi_id || null,
            cantieri_id: interazione.cantieri_id,
            attivita_id: attivita.id,
            external_id: randomUUID(),
            created_at: new Date(),
            last_update_at: new Date(),
            created_by: userId,
            last_update_by: userId,
          })),
        });

        return attivita;
      });

      // Revalidate paths and tags
      revalidatePath("/dashboard");
      revalidatePath("/admin/attivita");
      revalidateTag("attivita");
      revalidateTag("interazioni");
      revalidateTag("cantieri");
      revalidateTag(`user-attivita-${userId}`);

      return {
        success: true,
        attivitaId: result.id,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante la creazione dell'attività con interazioni",
      };
    }
  });
