import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth, getErrorMessage } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { transporter } from "@/lib/email";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// GET /api/users - Lista utenti (esclusi admin) con paginazione e filtro
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)),
    );
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const notBanned = searchParams.get("notBanned") === "true";

    const where: {
      role: { not: string };
      banned?: boolean;
      OR?: Array<
        | { name: { contains: string } }
        | { email: { contains: string } }
      >;
    } = {
      role: { not: "admin" },
    };
    if (notBanned) where.banned = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortOrder === "desc" ? "desc" : "asc",
    };

    const [usersList, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          banned: true,
          banReason: true,
          licenseCamion: true,
          licenseEscavatore: true,
          phone: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: usersList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore nel recupero utenti:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/users - Crea utente (Better Auth + email)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, email, phone, licenseCamion, licenseEscavatore } = body;

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json(
        { error: "Il nome è obbligatorio" },
        { status: 400 },
      );
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Email non valida" },
        { status: 400 },
      );
    }

    const randomPassword = Math.random().toString(36).substring(2, 15);
    const user = await auth.api.createUser({
      body: {
        name: name.trim(),
        email: email.trim(),
        password: randomPassword,
        role: "user",
      },
    });

    if (!user?.user) {
      return NextResponse.json(
        { error: "Impossibile creare l'utente" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.user.id },
      data: {
        phone: typeof phone === "string" ? phone : "",
        licenseCamion: licenseCamion === true || licenseCamion === "true",
        licenseEscavatore: licenseEscavatore === true || licenseEscavatore === "true",
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
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    const created = await prisma.user.findUnique({
      where: { id: user.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        licenseCamion: true,
        licenseEscavatore: true,
      },
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione utente:", error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: getErrorMessage(error.status?.toString() ?? error.body?.code ?? "") },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
