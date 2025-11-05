"use server";

import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import prisma from "@/lib/prisma";
import { actionClientWithAuth } from "@/lib/safe-action";

// --- CREA INTERAZIONE ---
export const createInterazione = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      ore: zfd.numeric(z.number().min(0, "Le ore devono essere >= 0")),
      minuti: zfd.numeric(
        z.number().min(0).max(59, "I minuti devono essere tra 0 e 59"),
      ),
      user_id: zfd.text(z.string().min(1, "L'utente è obbligatorio")),
      mezzi_id: zfd.numeric(z.number().optional()).optional(),
      cantieri_id: zfd.numeric(z.number().min(1, "Il cantiere è obbligatorio")),
      attivita_id: zfd.numeric(z.number().min(1, "L'attività è obbligatoria")),
      note: zfd.text(z.string().optional()),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(
    async ({
      parsedInput: {
        ore,
        minuti,
        user_id,
        mezzi_id,
        cantieri_id,
        attivita_id,
        note,
      },
      ctx: { userId },
    }) => {
      try {
        // Calculate tempo_totale in milliseconds
        const tempo_totale = BigInt((ore * 60 + minuti) * 60000);

        await prisma.interazioni.create({
          data: {
            ore,
            minuti,
            tempo_totale,
            note,
            user_id,
            mezzi_id: mezzi_id || null,
            cantieri_id,
            attivita_id,
            external_id: randomUUID(),
            created_at: new Date(),
            last_update_at: new Date(),
            created_by: userId,
            last_update_by: userId,
          },
        });

        revalidateTag("interazioni");
        revalidateTag("cantieri");
        revalidateTag("attivita");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante la creazione dell'interazione",
        };
      }
    },
  );

// --- MODIFICA INTERAZIONE ---
export const updateInterazione = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber]>([z.number().min(1, "ID obbligatorio")])
  .inputSchema(
    zfd.formData({
      ore: zfd
        .numeric(z.number().min(0, "Le ore devono essere >= 0"))
        .optional(),
      minuti: zfd
        .numeric(z.number().min(0).max(59, "I minuti devono essere tra 0 e 59"))
        .optional(),
      mezzi_id: zfd.numeric(z.number().optional()).optional(),
      attivita_id: zfd
        .numeric(z.number().min(1, "L'attività è obbligatoria"))
        .optional(),
      note: zfd.text(z.string().optional()),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(
    async ({
      bindArgsParsedInputs: [id],
      parsedInput: { ore, minuti, mezzi_id, attivita_id, note },
      ctx: { userId },
    }) => {
      try {
        // Get current interazione to calculate new tempo_totale
        const currentInterazione = await prisma.interazioni.findUnique({
          where: { id },
          select: { ore: true, minuti: true },
        });

        if (!currentInterazione) {
          return {
            success: false,
            error: "Interazione non trovata",
          };
        }

        const finalOre = ore !== undefined ? ore : currentInterazione.ore;
        const finalMinuti =
          minuti !== undefined ? minuti : currentInterazione.minuti;
        const tempo_totale = BigInt((finalOre * 60 + finalMinuti) * 60000);

        const updateData: Record<string, unknown> = {
          last_update_at: new Date(),
          last_update_by: userId,
          tempo_totale,
          note,
        };

        if (ore !== undefined) updateData.ore = ore;
        if (minuti !== undefined) updateData.minuti = minuti;
        if (mezzi_id !== undefined) updateData.mezzi_id = mezzi_id || null;
        if (attivita_id !== undefined) updateData.attivita_id = attivita_id;

        await prisma.interazioni.update({
          where: { id },
          data: updateData,
        });

        revalidateTag("interazioni");
        revalidateTag("cantieri");
        revalidateTag("attivita");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante l'aggiornamento dell'interazione",
        };
      }
    },
  );

// --- ELIMINA INTERAZIONE ---
export const deleteInterazione = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber]>([z.number().min(1, "ID obbligatorio")])
  .inputSchema(zfd.formData({}))
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ bindArgsParsedInputs: [id] }) => {
    try {
      await prisma.interazioni.delete({ where: { id } });
      revalidateTag("interazioni");
      revalidateTag("cantieri");
      revalidateTag("attivita");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante l'eliminazione dell'interazione",
      };
    }
  });
