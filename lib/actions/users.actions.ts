"use server";

import { randomUUID } from "node:crypto";
import { APIError } from "better-auth/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { auth, getErrorMessage } from "@/lib/auth";
import { actionClient, actionClientWithAuth } from "@/lib/safe-action";
import { transporter } from "../email";
import prisma from "../prisma";

// --- CREA UTENTE ---
export const createUser = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      name: zfd.text(z.string().min(1, "Il nome è obbligatorio")),
      email: zfd.text(z.email("Email non valida").min(1, "Email obbligatoria")),
      phone: zfd.text(z.string().optional()),
      licenseCamion: zfd.checkbox(),
      licenseEscavatore: zfd.checkbox(),
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
      parsedInput: { name, email, phone, licenseCamion, licenseEscavatore },
    }) => {
      try {
        const randomPassword = Math.random().toString(36).substring(2, 15);
        const user = await auth.api.createUser({
          body: {
            name,
            email,
            password: randomPassword,
            role: "user",
          },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.user.id },
            data: {
              phone: phone || "",
              licenseCamion: licenseCamion || false,
              licenseEscavatore: licenseEscavatore || false,
            },
          });
          await transporter.sendMail({
            to: email,
            subject: "Registrazione account Lunardi Movimento Terra",
            from: `"Lunardi Movimento Terra" <${process.env.EMAIL}>`,
            html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f7f9; padding: 24px; color: #111827;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04)">
              <tr>
                <td style="padding: 24px 28px; border-bottom: 1px solid #f1f5f9;">
                  <h1 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; color: #111827;">Benvenuto ${name}!</h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 20px; color: #4b5563;">Il tuo account è stato creato con successo.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 28px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #111827;">Di seguito trovi le tue credenziali di accesso:</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <tr>
                      <td style="padding: 12px 16px; font-size: 13px; color: #374151; width: 140px;">Email</td>
                      <td style="padding: 12px 16px; font-size: 13px; color: #111827; font-weight: 600;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 16px; font-size: 13px; color: #374151; width: 140px; border-top: 1px solid #e5e7eb;">Password</td>
                      <td style="padding: 12px 16px; font-size: 13px; color: #111827; font-weight: 600; border-top: 1px solid #e5e7eb;">${randomPassword}</td>
                    </tr>
                  </table>

                  <div style="height: 16px;"></div>

                  <a href="${process.env.BETTER_AUTH_URL}/sign-in" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">Accedi al portale</a>

                  <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280;">Se il pulsante non funziona, copia e incolla questo link nel browser:<br><span style="color: #2563eb; word-break: break-all;">${process.env.BETTER_AUTH_URL}/sign-in</span></p>
                  <p style="margin: 12px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280;">Se si desidera cambiare la password, cliccare il link di reset password: <a href="${process.env.BETTER_AUTH_URL}/reset-password" style="color: #2563eb; text-decoration: underline;">${process.env.BETTER_AUTH_URL}/reset-password</a></p>
                </td>
              </tr>
            </table>
          </div>
        `,
          });
        }
        revalidatePath("/utenti");

        return { success: true };
      } catch (error) {
        console.log(error);
        if (error instanceof APIError) {
          return {
            success: false,
            error: getErrorMessage(error.status.toString()),
          };
        }
        return {
          success: false,
          error: "Errore sconosciuto. Contattare l'assistenza",
        };
      }
    },
  );

// --- LOGIN USER ---
export const loginUser = actionClient
  .inputSchema(
    zfd.formData({
      email: zfd.text(z.email("Email non valida").min(1, "Email obbligatoria")),
      password: zfd.text(z.string().min(1, "Password obbligatoria")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { email, password } }) => {
    try {
      await auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });
    } catch (error) {
      console.log(error);
      if (error instanceof APIError) {
        return {
          success: false,
          error: getErrorMessage(error.body?.code ?? ""),
        };
      }

      return {
        success: false,
        error: "Errore sconosciuto. Contattare l'assistenza",
      };
    }
    redirect("/");
  });

// --- LOGOUT USER ---
export const logoutUser = actionClientWithAuth
  .inputSchema(zfd.formData({}))
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ ctx }) => {
    try {
      await auth.api.signOut({
        headers: ctx.headers,
      });
    } catch (error) {
      console.log(error);
      if (error instanceof APIError) {
        return {
          success: false,
          error: getErrorMessage(error.body?.code ?? ""),
        };
      }
      return {
        success: false,
        error: "Errore sconosciuto. Contattare l'assistenza",
      };
    }
    redirect("/sign-in");
  });

// --- RESET PASSWORD ---
export const resetPassword = actionClient
  .inputSchema(
    zfd.formData({
      email: zfd.text(z.email("Email non valida").min(1, "Email obbligatoria")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { email } }) => {
    try {
      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: `${process.env.BETTER_AUTH_URL}/reset-password`,
        },
      });
      return {
        success: true,
        message:
          "Email inviata con successo. Controlla la tua email per il link di reset password",
      };
    } catch (error) {
      console.log(error);
      if (error instanceof APIError) {
        return {
          success: false,
          error: getErrorMessage(error.body?.code ?? ""),
        };
      }
      return {
        success: false,
        error: "Errore sconosciuto. Contattare l'assistenza",
      };
    }
  });

// --- RESET PASSWORD WITH TOKEN ---
export const resetPasswordWithToken = actionClient
  .inputSchema(
    zfd.formData({
      token: zfd.text(z.string().min(1, "Token obbligatorio")),
      password: zfd.text(z.string().min(1, "Password obbligatoria")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { token, password } }) => {
    try {
      await auth.api.resetPassword({
        body: {
          token,
          newPassword: password,
        },
      });
      return {
        success: true,
        message:
          "Password aggiornata con successo. Effettua nuovamente il login",
      };
    } catch (error) {
      console.log(error);
      if (error instanceof APIError) {
        return {
          success: false,
          error: getErrorMessage(error.body?.code ?? ""),
        };
      }
      return {
        success: false,
        error: "Errore sconosciuto. Contattare l'assistenza",
      };
    }
  });

// --- BAN USER ---
export const banUser = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      userId: zfd.text(z.string().min(1, "ID utente obbligatorio")),
      // reason is optional and might be absent in the form
      reason: zfd.text(z.string().optional()).optional(),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { userId, reason }, ctx: { headers } }) => {
    try {
      await auth.api.banUser({
        body: {
          userId,
          banReason: reason,
        },
        headers,
      });
      revalidatePath("/utenti");
      return { success: true };
    } catch (error) {
      console.log(error);
      if (error instanceof APIError) {
        return {
          success: false,
          error: getErrorMessage(error.body?.code ?? ""),
        };
      }
      return {
        success: false,
        error: "Errore sconosciuto. Contattare l'assistenza",
      };
    }
  });

// --- UNBAN USER ---
export const unbanUser = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      userId: zfd.text(z.string().min(1, "ID utente obbligatorio")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { userId }, ctx: { headers } }) => {
    try {
      await auth.api.unbanUser({
        body: {
          userId,
        },
        headers,
      });
      revalidatePath("/utenti");
      return { success: true };
    } catch (error) {
      console.log(error);
      if (error instanceof APIError) {
        return {
          success: false,
          error: getErrorMessage(error.status.toString()),
        };
      }
      return {
        success: false,
        error: "Errore sconosciuto. Contattare l'assistenza",
      };
    }
  });

export const updateUser = actionClientWithAuth
  .bindArgsSchemas<[id: z.ZodString]>([
    z.string().min(1, "ID utente obbligatorio"),
  ])
  .inputSchema(
    zfd.formData({
      licenseCamion: zfd.checkbox(),
      licenseEscavatore: zfd.checkbox(),
      phone: zfd.text(z.string().optional()),
      name: zfd.text(z.string().min(1, "Nome obbligatorio")),
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
      parsedInput: { licenseCamion, licenseEscavatore, phone, name },
    }) => {
      try {
        await prisma.user.update({
          where: { id },
          data: {
            licenseCamion: licenseCamion || false,
            licenseEscavatore: licenseEscavatore || false,
            phone: phone || "",
            name: name || "",
          },
        });
        revalidatePath("/utenti");
        return { success: true };
      } catch (error) {
        console.log(error);
        if (error instanceof APIError) {
          return {
            success: false,
            error: getErrorMessage(error.status.toString()),
          };
        }
        return {
          success: false,
          error: "Errore sconosciuto. Contattare l'assistenza",
        };
      }
    },
  );

// --- ASSOCIA UTENTE A MEZZO ---
export const createUserMezzo = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      userId: zfd.text(z.string().min(1, "ID utente obbligatorio")),
      mezziId: zfd.text(z.string().min(1, "ID mezzo obbligatorio")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { userId, mezziId } }) => {
    try {
      // Verifica che l'utente e il mezzo esistano
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const mezzo = await prisma.mezzi.findUnique({
        where: { id: parseInt(mezziId, 10) },
      });

      if (!user) {
        return { success: false, error: "Utente non trovato" };
      }
      if (!mezzo) {
        return { success: false, error: "Mezzo non trovato" };
      }

      // Verifica se l'associazione esiste già
      const existingAssociation = await prisma.user_mezzi.findFirst({
        where: {
          user_id: userId,
          mezzi_id: parseInt(mezziId, 10),
        },
      });

      if (existingAssociation) {
        return {
          success: false,
          error: "L'utente è già associato a questo mezzo",
        };
      }

      await prisma.user_mezzi.create({
        data: {
          user_id: userId,
          mezzi_id: parseInt(mezziId, 10),
          external_id: randomUUID(),
        },
      });

      revalidatePath("/utenti");
      revalidatePath("/mezzi");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante l'associazione utente-mezzo",
      };
    }
  });

// --- RIMUOVI ASSOCIAZIONE UTENTE-MEZZO ---
export const deleteUserMezzo = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      userId: zfd.text(z.string().min(1, "ID utente obbligatorio")),
      mezziId: zfd.text(z.string().min(1, "ID mezzo obbligatorio")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { userId, mezziId } }) => {
    try {
      const association = await prisma.user_mezzi.findFirst({
        where: {
          user_id: userId,
          mezzi_id: parseInt(mezziId, 10),
        },
      });

      if (!association) {
        return { success: false, error: "Associazione non trovata" };
      }

      await prisma.user_mezzi.delete({
        where: { id: association.id },
      });

      revalidatePath("/utenti");
      revalidatePath("/mezzi");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante la rimozione dell'associazione utente-mezzo",
      };
    }
  });

// --- ASSOCIA UTENTE A CANTIERE ---
export const createUserCantiere = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      userId: zfd.text(z.string().min(1, "ID utente obbligatorio")),
      cantieriId: zfd.text(z.string().min(1, "ID cantiere obbligatorio")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { userId, cantieriId } }) => {
    try {
      // Verifica che l'utente e il cantiere esistano
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const cantiere = await prisma.cantieri.findUnique({
        where: { id: parseInt(cantieriId, 10) },
      });

      if (!user) {
        return { success: false, error: "Utente non trovato" };
      }
      if (!cantiere) {
        return { success: false, error: "Cantiere non trovato" };
      }

      // Verifica se l'associazione esiste già
      const existingAssociation = await prisma.user_cantieri.findFirst({
        where: {
          user_id: userId,
          cantieri_id: parseInt(cantieriId, 10),
        },
      });

      if (existingAssociation) {
        return {
          success: false,
          error: "L'utente è già associato a questo cantiere",
        };
      }

      await prisma.user_cantieri.create({
        data: {
          user_id: userId,
          cantieri_id: parseInt(cantieriId, 10),
          external_id: randomUUID(),
        },
      });

      revalidatePath("/utenti");
      revalidatePath("/cantieri");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante l'associazione utente-cantiere",
      };
    }
  });

// --- RIMUOVI ASSOCIAZIONE UTENTE-CANTIERE ---
export const deleteUserCantiere = actionClientWithAuth
  .inputSchema(
    zfd.formData({
      userId: zfd.text(z.string().min(1, "ID utente obbligatorio")),
      cantieriId: zfd.text(z.string().min(1, "ID cantiere obbligatorio")),
    }),
  )
  .outputSchema(
    z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput: { userId, cantieriId } }) => {
    try {
      const association = await prisma.user_cantieri.findFirst({
        where: {
          user_id: userId,
          cantieri_id: parseInt(cantieriId, 10),
        },
      });

      if (!association) {
        return { success: false, error: "Associazione non trovata" };
      }

      await prisma.user_cantieri.delete({
        where: { id: association.id },
      });

      revalidatePath("/utenti");
      revalidatePath("/cantieri");
      return { success: true };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: "Errore durante la rimozione dell'associazione utente-cantiere",
      };
    }
  });
