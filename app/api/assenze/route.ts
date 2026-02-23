import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import type { assenza_tipo } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { markAttivitaUncheckedIfNonAdmin } from "@/lib/attivita-check";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 500;

const VALID_TIPI = [
  "FERIE",
  "PERMESSO",
  "CASSA_INTEGRAZIONE",
  "MUTUA",
  "PATERNITA",
] as const;

function serializeAssenza(ass: { tempo_totale: bigint } & Record<string, unknown>) {
  const { tempo_totale, ...rest } = ass;
  return {
    ...rest,
    tempo_totale:
      typeof tempo_totale === "bigint" ? tempo_totale.toString() : tempo_totale,
  };
}

// GET /api/assenze - Lista assenze con paginazione e filtri
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
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const attivitaIdParam = searchParams.get("attivitaId") || "";

    const where: { attivita_id?: number } = {};
    if (attivitaIdParam) {
      const attivitaId = parseInt(attivitaIdParam, 10);
      if (!Number.isNaN(attivitaId)) where.attivita_id = attivitaId;
    }

    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortOrder === "desc" ? "desc" : "asc",
    };

    const [assenzeList, total] = await Promise.all([
      prisma.assenze.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          attivita: { select: { id: true, date: true, external_id: true } },
          user_assenza_created_byTouser: { select: { id: true, name: true } },
          user_assenza_last_update_byTouser: { select: { id: true, name: true } },
        },
      }),
      prisma.assenze.count({ where }),
    ]);

    const serialized = assenzeList.map(serializeAssenza);

    return NextResponse.json({
      assenze: serialized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore nel recupero assenze:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/assenze - Crea assenza
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
    const { tipo, attivita_id, user_id, ore, minuti, note } = body;

    if (!tipo || typeof tipo !== "string") {
      return NextResponse.json(
        { error: "Il tipo di assenza è obbligatorio" },
        { status: 400 },
      );
    }
    if (!(VALID_TIPI as readonly string[]).includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo di assenza non valido" },
        { status: 400 },
      );
    }
    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        { error: "L'utente è obbligatorio" },
        { status: 400 },
      );
    }
    if (!attivita_id || typeof attivita_id !== "number") {
      return NextResponse.json(
        { error: "L'attività è obbligatoria" },
        { status: 400 },
      );
    }

    const finalOre = ore !== undefined && ore !== null ? Number(ore) : 8;
    const finalMinuti =
      minuti !== undefined && minuti !== null
        ? Math.min(59, Math.max(0, Number(minuti)))
        : 0;

    if (finalOre < 0) {
      return NextResponse.json(
        { error: "Le ore devono essere >= 0" },
        { status: 400 },
      );
    }
    if (finalMinuti < 0 || finalMinuti > 59) {
      return NextResponse.json(
        { error: "I minuti devono essere tra 0 e 59" },
        { status: 400 },
      );
    }

    const tempo_totale = BigInt((finalOre * 60 + finalMinuti) * 60000);
    const userId = session.user.id as string;

    const assenza = await prisma.assenze.create({
      data: {
        tipo: tipo as assenza_tipo,
        ore: finalOre,
        minuti: finalMinuti,
        tempo_totale,
        note: typeof note === "string" ? note : null,
        user_id,
        attivita_id,
        external_id: randomUUID(),
        created_at: new Date(),
        last_update_at: new Date(),
        created_by: userId,
        last_update_by: userId,
      },
      include: {
        user: { select: { id: true, name: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
      },
    });

    await markAttivitaUncheckedIfNonAdmin(prisma, attivita_id, session);

    return NextResponse.json(
      { assenza: serializeAssenza(assenza) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Errore nella creazione assenza:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
