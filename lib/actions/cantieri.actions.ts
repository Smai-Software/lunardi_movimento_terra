"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import prisma from "@/lib/prisma";
import { actionClientWithAuth } from "@/lib/safe-action";
import { randomUUID } from "crypto";

// --- CREA CANTIERE ---
export const createCantiere = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      nome: zfd.text(z.string().min(1, "Il nome è obbligatorio")),
      descrizione: zfd.text(z.string().min(1, "La descrizione è obbligatoria")),
      open: zfd.text(z.boolean().optional()),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(
    async ({ parsedInput: { nome, descrizione, open }, ctx: { userId } }) => {
      try {
        await prisma.cantieri.create({
          data: {
            nome,
            descrizione,
            open: open ?? true,
            created_at: new Date(),
            last_update_at: new Date(),
            created_by: userId,
            last_update_by: userId,
            external_id: randomUUID(),
          },
        });
        revalidatePath("/cantieri");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante la creazione del cantiere",
        };
      }
    },
  );

// --- MODIFICA CANTIERE ---
export const updateCantiere = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber]>([z.number().min(1, "ID obbligatorio")])
  .inputSchema(
    zfd.formData({
      nome: zfd.text(z.string().optional()).optional(),
      descrizione: zfd.text(z.string().optional()).optional(),
      open: zfd.text(z.boolean().optional()).optional(),
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
      parsedInput: { nome, descrizione, open },
      ctx: { userId },
    }) => {
      try {
        const updateData: any = {
          last_update_at: new Date(),
          last_update_by: userId,
        };

        if (nome !== undefined) updateData.nome = nome;
        if (descrizione !== undefined) updateData.descrizione = descrizione;
        if (open !== undefined) {
          updateData.open = open;
          if (!open) {
            updateData.closed_at = new Date();
          } else {
            updateData.closed_at = null;
          }
        }

        await prisma.cantieri.update({
          where: { id },
          data: updateData,
        });
        revalidatePath("/cantieri");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante l'aggiornamento del cantiere",
        };
      }
    },
  );

// --- ELIMINA CANTIERE ---
export const deleteCantiere = actionClientWithAuth
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
      await prisma.cantieri.delete({ where: { id } });
      revalidatePath("/cantieri");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante l'eliminazione del cantiere",
      };
    }
  });
