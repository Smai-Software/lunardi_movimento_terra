"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { getCantieriByUserId } from "@/lib/data/cantieri.data";
import prisma from "@/lib/prisma";
import { actionClientWithAuth } from "@/lib/safe-action";

// --- CREA CANTIERE ---
export const createCantiere = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      nome: zfd.text(z.string().min(1, "Il nome è obbligatorio")),
      descrizione: zfd.text(z.string().optional()),
      open: zfd.text(z.string().min(1, "Lo stato del cantiere è obbligatorio")),
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
            descrizione: descrizione || "",
            open: open === "1",
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
      nome: zfd.text(z.string().optional()),
      descrizione: zfd.text(z.string().optional()),
      open: zfd.checkbox(),
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
        await prisma.cantieri.update({
          where: { id },
          data: {
            nome,
            descrizione: descrizione || "",
            open,
            last_update_at: new Date(),
            last_update_by: userId,
          },
        });

        revalidatePath("/cantieri", "page");
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

// --- GET CANTIERI BY USER ID ---
export const getCantieriForUser = actionClientWithAuth
  .inputSchema(
    z.object({
      userId: z.string().min(1, "ID utente obbligatorio"),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      cantieri: z.array(
        z.object({
          id: z.number(),
          nome: z.string(),
          descrizione: z.string(),
          open: z.boolean(),
        }),
      ),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { userId } }) => {
    try {
      const cantieri = await getCantieriByUserId(userId);
      return {
        success: true,
        cantieri: cantieri.map((c) => ({
          id: c.id,
          nome: c.nome,
          descrizione: c.descrizione,
          open: c.open,
        })),
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        cantieri: [],
        error: "Errore durante il caricamento dei cantieri",
      };
    }
  });

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
      revalidateTag("cantieri");
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante l'eliminazione del cantiere",
      };
    }
    redirect("/cantieri");
  });

// --- AGGIUNGI UTENTE CANTIERE ---
export const addUtenteCantiere = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber, userId: z.ZodString]>([
    z.number().min(1, "ID obbligatorio"),
    z.string().min(1, "ID utente obbligatorio"),
  ])
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ bindArgsParsedInputs: [cantiereId, userId] }) => {
    try {
      // Verifica che l'utente non sia già assegnato
      const existingAssignment = await prisma.user_cantieri.findFirst({
        where: {
          cantieri_id: cantiereId,
          user_id: userId,
        },
      });

      if (existingAssignment) {
        return {
          success: false,
          error: "L'utente è già assegnato a questo cantiere",
        };
      }

      // Aggiungi nuovo assegnamento
      await prisma.user_cantieri.create({
        data: {
          user_id: userId,
          cantieri_id: cantiereId,
          external_id: randomUUID(),
        },
      });

      revalidatePath("/cantieri", "page");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante l'assegnazione dell'utente al cantiere",
      };
    }
  });

// --- RIMUOVI UTENTE CANTIERE ---
export const removeUtenteCantiere = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber, userId: z.ZodString]>([
    z.number().min(1, "ID obbligatorio"),
    z.string().min(1, "ID utente obbligatorio"),
  ])
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ bindArgsParsedInputs: [cantiereId, userId] }) => {
    try {
      // Rimuovi assegnamento
      const deleteResult = await prisma.user_cantieri.deleteMany({
        where: {
          cantieri_id: cantiereId,
          user_id: userId,
        },
      });

      if (deleteResult.count === 0) {
        return {
          success: false,
          error: "Utente non trovato per la rimozione",
        };
      }

      revalidatePath("/cantieri", "page");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante la rimozione dell'utente dal cantiere",
      };
    }
  });
