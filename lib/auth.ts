import { cache } from "react";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { transporter } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        defaultValue: "",
        input: true,
        fieldName: "phone",
      },
      licenseCamion: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: true,
        fieldName: "licenseCamion",
      },
      licenseEscavatore: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: true,
        fieldName: "licenseEscavatore",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await transporter.sendMail({
        to: user.email,
        subject: "Reimposta la password",
        from: `"Lunardi Movimento Terra" <${process.env.EMAIL}>`,
        text: `Hai richiesto di reimpostare la password del tuo account.\n\nPer procedere clicca il seguente link: ${url}\n\nSe non hai richiesto questo cambio, puoi ignorare questa email.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f7f9; padding: 24px; color: #111827;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04)">
              <tr>
                <td style="padding: 24px 28px; border-bottom: 1px solid #f1f5f9;">
                  <h1 style="margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; color: #111827;">Reimposta la password</h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 20px; color: #4b5563;">Hai richiesto di reimpostare la password del tuo account.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 28px;">
                  <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #111827;">Clicca il pulsante qui sotto per procedere con il reset della password.</p>

                  <a href="${url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">Reimposta password</a>

                  <p style="margin: 16px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280;">Se il pulsante non funziona, copia e incolla questo link nel browser:<br><span style="color: #2563eb; word-break: break-all;">${url}</span></p>
                  <p style="margin: 12px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280;">Se non hai richiesto questo cambio, puoi ignorare questa email.</p>
                </td>
              </tr>
            </table>
          </div>
        `,
      });
    },
    minPasswordLength: 8,
  },
  plugins: [admin(), nextCookies()],
});

export type SessionWithUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

/**
 * Cached getSession for Server Components. Deduplicates within the same RSC request
 * (e.g. layout + page). Use in app/ pages/layouts only; API routes keep auth.api.getSession.
 */
export const getSession = cache(async () => {
  const h = await headers();
  return auth.api.getSession({ headers: h });
});

export const errorCodes = {
  USER_NOT_FOUND: "Utente non trovato",
  FAILED_TO_CREATE_USER: "Impossibile creare l'utente",
  FAILED_TO_CREATE_SESSION: "Impossibile creare la sessione",
  FAILED_TO_UPDATE_USER: "Impossibile aggiornare l'utente",
  FAILED_TO_GET_SESSION: "Impossibile ottenere la sessione",
  INVALID_PASSWORD: "Password non valida",
  INVALID_EMAIL: "Email non valida",
  INVALID_EMAIL_OR_PASSWORD: "Email o password errati",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "Account social già collegato",
  PROVIDER_NOT_FOUND: "Provider non trovato",
  INVALID_TOKEN: "Token non valido",
  ID_TOKEN_NOT_SUPPORTED: "ID token non supportato",
  FAILED_TO_GET_USER_INFO: "Impossibile ottenere le informazioni utente",
  USER_EMAIL_NOT_FOUND: "Email utente non trovata",
  EMAIL_NOT_VERIFIED: "Email non verificata",
  PASSWORD_TOO_SHORT: "Password troppo corta",
  PASSWORD_TOO_LONG: "Password troppo lunga",
  USER_ALREADY_EXISTS: "Utente già registrato",
  EMAIL_CAN_NOT_BE_UPDATED: "L'email non può essere aggiornata",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Account credenziali non trovato",
  SESSION_EXPIRED: "Sessione scaduta",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "Impossibile scollegare l'ultimo account",
  ACCOUNT_NOT_FOUND: "Account non trovato",
  USER_ALREADY_HAS_PASSWORD: "L'utente ha già una password",
  INVALID_OTP: "Codice OTP non valido",
  TOO_MANY_ATTEMPTS: "Hai effettuato troppi tentativi. Riprova tra 15 minuti",
  BAD_REQUEST: "Richiesta non valida",
} as const;

export function getErrorMessage(code: string): string {
  const message = errorCodes[code as keyof typeof errorCodes];
  if (message) return message;
  return "Errore sconosciuto. Contattare l'assistenza";
}
