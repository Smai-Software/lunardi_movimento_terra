"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import prisma from "@/lib/prisma";
import { actionClientWithAuth } from "@/lib/safe-action";
import { randomUUID } from "crypto";

// --- CREA MEZZO ---
export const createMezzo = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      nome: zfd.text(z.string().min(1, "Il nome è obbligatorio")),
      descrizione: zfd.text(z.string().min(1, "La descrizione è obbligatoria")),
      has_license_camion: zfd.checkbox(),
      has_license_escavatore: zfd.checkbox(),
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
        nome,
        descrizione,
        has_license_camion,
        has_license_escavatore,
      },
      ctx: { userId },
    }) => {
      try {
        await prisma.mezzi.create({
          data: {
            nome,
            descrizione,
            has_license_camion: has_license_camion || false,
            has_license_escavatore: has_license_escavatore || false,
            created_at: new Date(),
            last_update_at: new Date(),
            created_by: userId,
            last_update_by: userId,
            external_id: randomUUID(),
          },
        });
        revalidatePath("/mezzi");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante la creazione del mezzo",
        };
      }
    },
  );

// --- MODIFICA MEZZO ---
export const updateMezzo = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber]>([z.number().min(1, "ID obbligatorio")])
  .inputSchema(
    zfd.formData({
      nome: zfd.text(z.string().optional()).optional(),
      descrizione: zfd.text(z.string().optional()).optional(),
      has_license_camion: zfd.checkbox(),
      has_license_escavatore: zfd.checkbox(),
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
      parsedInput: {
        nome,
        descrizione,
        has_license_camion,
        has_license_escavatore,
      },
      ctx: { userId },
    }) => {
      try {
        await prisma.mezzi.update({
          where: { id },
          data: {
            nome,
            descrizione,
            has_license_camion: has_license_camion || false,
            has_license_escavatore: has_license_escavatore || false,
            last_update_at: new Date(),
            last_update_by: userId,
          },
        });
        revalidatePath("/mezzi");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante l'aggiornamento del mezzo",
        };
      }
    },
  );

// --- ELIMINA MEZZO ---
export const deleteMezzo = actionClientWithAuth
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
      await prisma.mezzi.delete({ where: { id } });
      revalidatePath("/mezzi");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante l'eliminazione del mezzo",
      };
    }
  });

// --- GET UTENTI ASSEGNATI MEZZO ---
export const getUtentiAssegnatiMezzo = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber]>([z.number().min(1, "ID obbligatorio")])
  .inputSchema(zfd.formData({}))
  .outputSchema(
    z.object({
      success: z.boolean(),
      userIds: z.array(z.string()),
      error: z.string().optional(),
    }),
  )
  .action(async ({ bindArgsParsedInputs: [mezziId] }) => {
    try {
      const assignments = await prisma.user_mezzi.findMany({
        where: { mezzi_id: mezziId },
        select: { user_id: true },
      });
      
      const userIds = assignments.map((assignment) => assignment.user_id);
      return { success: true, userIds };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        userIds: [],
        error: "Errore durante il caricamento degli utenti assegnati",
      };
    }
  });

// --- ASSEGNA UTENTI MEZZO ---
export const assignUtentiMezzo = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber]>([z.number().min(1, "ID obbligatorio")])
  .inputSchema(
    zfd.formData({
      userIds: zfd.repeatable(zfd.text(z.string())),
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
      bindArgsParsedInputs: [mezziId],
      parsedInput: { userIds },
    }) => {
      try {
        // Ottieni gli utenti attualmente assegnati al mezzo
        const currentAssignments = await prisma.user_mezzi.findMany({
          where: { mezzi_id: mezziId },
          select: { user_id: true },
        });
        const currentUserIds = currentAssignments.map((assignment) => assignment.user_id);

        // Converti userIds da string a array di stringhe
        const newUserIds = Array.isArray(userIds) ? userIds : [userIds].filter(Boolean);

        // Trova gli utenti da aggiungere (presenti nel form ma non nel DB)
        const usersToAdd = newUserIds.filter((id) => !currentUserIds.includes(id));

        // Trova gli utenti da rimuovere (presenti nel DB ma non nel form)
        const usersToRemove = currentUserIds.filter((id) => !newUserIds.includes(id));

        // Aggiungi nuovi assegnamenti
        if (usersToAdd.length > 0) {
          await prisma.user_mezzi.createMany({
            data: usersToAdd.map((user_id) => ({
              user_id,
              mezzi_id: mezziId,
              external_id: randomUUID(),
            })),
          });
        }

        // Rimuovi assegnamenti non più validi
        if (usersToRemove.length > 0) {
          await prisma.user_mezzi.deleteMany({
            where: {
              mezzi_id: mezziId,
              user_id: { in: usersToRemove },
            },
          });
        }

        revalidatePath("/mezzi");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante l'assegnazione degli utenti al mezzo",
        };
      }
    },
  );

// --- AGGIUNGI UTENTE MEZZO ---
export const addUtenteMezzo = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber, userId: z.ZodString]>([
    z.number().min(1, "ID obbligatorio"),
    z.string().min(1, "ID utente obbligatorio")
  ])
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(
    async ({
      bindArgsParsedInputs: [mezziId, userId],
    }) => {
      try {
        // Verifica che l'utente non sia già assegnato
        const existingAssignment = await prisma.user_mezzi.findFirst({
          where: { 
            mezzi_id: mezziId,
            user_id: userId
          },
        });

        if (existingAssignment) {
          return {
            success: false,
            error: "L'utente è già assegnato a questo mezzo",
          };
        }

        // Aggiungi nuovo assegnamento
        await prisma.user_mezzi.create({
          data: {
            user_id: userId,
            mezzi_id: mezziId,
            external_id: randomUUID(),
          },
        });

        revalidatePath("/mezzi");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante l'assegnazione dell'utente al mezzo",
        };
      }
    },
  );

// --- RIMUOVI UTENTE MEZZO ---
export const removeUtenteMezzo = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber, userId: z.ZodString]>([
    z.number().min(1, "ID obbligatorio"),
    z.string().min(1, "ID utente obbligatorio")
  ])
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(
    async ({
      bindArgsParsedInputs: [mezziId, userId],
    }) => {
      try {
        // Rimuovi assegnamento
        const deleteResult = await prisma.user_mezzi.deleteMany({
          where: {
            mezzi_id: mezziId,
            user_id: userId,
          },
        });

        if (deleteResult.count === 0) {
          return {
            success: false,
            error: "Utente non trovato per la rimozione",
          };
        }

        revalidatePath("/mezzi");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante la rimozione dell'utente dal mezzo",
        };
      }
    },
  );
