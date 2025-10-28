"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import prisma from "@/lib/prisma";
import { actionClientWithAuth } from "@/lib/safe-action";

// --- CREA ATTIVITA ---
export const createAttivita = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      date: zfd.text(z.string().min(1, "La data è obbligatoria")),
      user_id: zfd.text(z.string().min(1, "L'utente è obbligatorio")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { date, user_id }, ctx: { userId } }) => {
    try {
      await prisma.attivita.create({
        data: {
          date: new Date(date),
          user_id,
          created_at: new Date(),
          last_update_at: new Date(),
          created_by: userId,
          last_update_by: userId,
          external_id: randomUUID(),
        },
      });
      revalidatePath("/admin/attivita");
      revalidateTag("attivita");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante la creazione dell'attività",
      };
    }
  });

// --- MODIFICA ATTIVITA ---
export const updateAttivita = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber]>([z.number().min(1, "ID obbligatorio")])
  .inputSchema(
    zfd.formData({
      date: zfd.text(z.string().optional()),
      user_id: zfd.text(z.string().optional()),
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
      parsedInput: { date, user_id },
      ctx: { userId },
    }) => {
      try {
        const updateData: {
          last_update_at: Date;
          last_update_by: string;
          date?: Date;
          user_id?: string;
        } = {
          last_update_at: new Date(),
          last_update_by: userId,
        };

        if (date) {
          updateData.date = new Date(date);
        }
        if (user_id) {
          updateData.user_id = user_id;
        }

        await prisma.attivita.update({
          where: { id },
          data: updateData,
        });

        revalidatePath("/admin/attivita", "page");
        revalidateTag("attivita");
        return { success: true };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante l'aggiornamento dell'attività",
        };
      }
    },
  );

// --- CREA ATTIVITA CON INTERAZIONI ---
export const createAttivitaWithInterazioni = actionClientWithAuth
  .inputSchema(
    z.object({
      date: z.string().min(1, "La data è obbligatoria"),
      user_id: z.string().min(1, "L'utente è obbligatorio"),
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
  .action(
    async ({
      parsedInput: { date, user_id, interazioni },
      ctx: { userId },
    }) => {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Create attivita record
          const attivita = await tx.attivita.create({
            data: {
              date: new Date(date),
              user_id,
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
              user_id,
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

        revalidatePath("/admin/attivita");
        revalidateTag("attivita");
        revalidateTag("interazioni");
        revalidateTag("cantieri");

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
    },
  );

// --- MODIFICA ATTIVITA CON INTERAZIONI ---
export const updateAttivitaWithInterazioni = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodNumber]>([z.number().min(1, "ID obbligatorio")])
  .inputSchema(
    z.object({
      date: z.string().min(1, "La data è obbligatoria"),
      user_id: z.string().min(1, "L'utente è obbligatorio"),
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
    }),
  )
  .action(
    async ({
      bindArgsParsedInputs: [id],
      parsedInput: { date, user_id, interazioni },
      ctx: { userId },
    }) => {
      try {
        await prisma.$transaction(async (tx) => {
          // Update attivita record
          await tx.attivita.update({
            where: { id },
            data: {
              date: new Date(date),
              user_id,
              last_update_at: new Date(),
              last_update_by: userId,
            },
          });

          // Delete all existing interazioni for this attivita
          await tx.interazioni.deleteMany({
            where: { attivita_id: id },
          });

          // Create new interazioni records
          await tx.interazioni.createMany({
            data: interazioni.map((interazione) => ({
              ore: interazione.ore,
              minuti: interazione.minuti,
              tempo_totale: BigInt(
                (interazione.ore * 60 + interazione.minuti) * 60000,
              ),
              user_id,
              mezzi_id: interazione.mezzi_id || null,
              cantieri_id: interazione.cantieri_id,
              attivita_id: id,
              external_id: randomUUID(),
              created_at: new Date(),
              last_update_at: new Date(),
              created_by: userId,
              last_update_by: userId,
            })),
          });
        });

        revalidatePath("/admin/attivita");
        revalidateTag("attivita");
        revalidateTag("interazioni");
        revalidateTag("cantieri");

        return {
          success: true,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false,
          error: "Errore durante l'aggiornamento dell'attività con interazioni",
        };
      }
    },
  );

// --- ELIMINA ATTIVITA ---
export const deleteAttivita = actionClientWithAuth
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
      await prisma.attivita.delete({ where: { id } });
      revalidateTag("attivita");
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante l'eliminazione dell'attività",
      };
    }
    redirect("/admin/attivita");
  });
