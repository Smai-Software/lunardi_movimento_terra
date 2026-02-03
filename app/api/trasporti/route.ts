import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function serializeTrasporto(tr: { tempo_totale: bigint } & Record<string, unknown>) {
  const { tempo_totale, ...rest } = tr;
  return {
    ...rest,
    tempo_totale: typeof tempo_totale === "bigint" ? tempo_totale.toString() : tempo_totale,
  };
}

async function checkUserAssignments(
  userId: string,
  cantieriPartenzaId: number,
  cantieriArrivoId: number,
  mezziId: number,
) {
  const [partenzaAssigned, arrivoAssigned, mezzoAssigned] = await Promise.all([
    prisma.user_cantieri.findFirst({
      where: { user_id: userId, cantieri_id: cantieriPartenzaId },
    }),
    prisma.user_cantieri.findFirst({
      where: { user_id: userId, cantieri_id: cantieriArrivoId },
    }),
    prisma.user_mezzi.findFirst({
      where: { user_id: userId, mezzi_id: mezziId },
    }),
  ]);
  if (!partenzaAssigned) return { ok: false, error: "Cantiere partenza non assegnato all'utente" };
  if (!arrivoAssigned) return { ok: false, error: "Cantiere arrivo non assegnato all'utente" };
  if (!mezzoAssigned) return { ok: false, error: "Mezzo non assegnato all'utente" };
  return { ok: true };
}

// GET /api/trasporti - Lista trasporti con paginazione e filtri
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
    const cantiereIdParam = searchParams.get("cantiereId") || "";

    const where: {
      attivita_id?: number;
      OR?: Array<
        | { cantieri_partenza_id: number }
        | { cantieri_arrivo_id: number }
      >;
    } = {};
    if (attivitaIdParam) {
      const attivitaId = parseInt(attivitaIdParam, 10);
      if (!Number.isNaN(attivitaId)) where.attivita_id = attivitaId;
    }
    if (cantiereIdParam) {
      const cantiereId = parseInt(cantiereIdParam, 10);
      if (!Number.isNaN(cantiereId)) {
        where.OR = [
          { cantieri_partenza_id: cantiereId },
          { cantieri_arrivo_id: cantiereId },
        ];
      }
    }

    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortOrder === "desc" ? "desc" : "asc",
    };

    const [trasportiList, total] = await Promise.all([
      prisma.trasporti.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          mezzi: { select: { id: true, nome: true } },
          cantieri_partenza: { select: { id: true, nome: true } },
          cantieri_arrivo: { select: { id: true, nome: true } },
          attivita: { select: { id: true, date: true, external_id: true } },
          user_trasporto_created_byTouser: { select: { id: true, name: true } },
          user_trasporto_last_update_byTouser: { select: { id: true, name: true } },
        },
      }),
      prisma.trasporti.count({ where }),
    ]);

    const serialized = trasportiList.map(serializeTrasporto);

    return NextResponse.json({
      trasporti: serialized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore nel recupero trasporti:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/trasporti - Crea trasporto
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
    const {
      ore,
      minuti,
      user_id,
      mezzi_id,
      cantieri_partenza_id,
      cantieri_arrivo_id,
      attivita_id,
      note,
    } = body;

    if (typeof ore !== "number" || ore < 0) {
      return NextResponse.json(
        { error: "Le ore devono essere >= 0" },
        { status: 400 },
      );
    }
    if (typeof minuti !== "number" || minuti < 0 || minuti > 59) {
      return NextResponse.json(
        { error: "I minuti devono essere tra 0 e 59" },
        { status: 400 },
      );
    }
    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        { error: "L'utente è obbligatorio" },
        { status: 400 },
      );
    }
    if (cantieri_partenza_id == null || typeof cantieri_partenza_id !== "number") {
      return NextResponse.json(
        { error: "Il cantiere partenza è obbligatorio" },
        { status: 400 },
      );
    }
    if (cantieri_arrivo_id == null || typeof cantieri_arrivo_id !== "number") {
      return NextResponse.json(
        { error: "Il cantiere arrivo è obbligatorio" },
        { status: 400 },
      );
    }
    if (cantieri_partenza_id === cantieri_arrivo_id) {
      return NextResponse.json(
        { error: "Cantiere partenza e arrivo devono essere diversi" },
        { status: 400 },
      );
    }
    if (mezzi_id == null || typeof mezzi_id !== "number") {
      return NextResponse.json(
        { error: "Il mezzo è obbligatorio" },
        { status: 400 },
      );
    }
    if (!attivita_id || typeof attivita_id !== "number") {
      return NextResponse.json(
        { error: "L'attività è obbligatoria" },
        { status: 400 },
      );
    }

    const check = await checkUserAssignments(
      user_id,
      cantieri_partenza_id,
      cantieri_arrivo_id,
      mezzi_id,
    );
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const tempo_totale = BigInt((ore * 60 + minuti) * 60000);
    const userId = session.user.id as string;

    const trasporto = await prisma.trasporti.create({
      data: {
        ore,
        minuti,
        tempo_totale,
        note: typeof note === "string" ? note : null,
        user_id,
        mezzi_id,
        cantieri_partenza_id,
        cantieri_arrivo_id,
        attivita_id,
        external_id: randomUUID(),
        created_at: new Date(),
        last_update_at: new Date(),
        created_by: userId,
        last_update_by: userId,
      },
      include: {
        user: { select: { id: true, name: true } },
        mezzi: { select: { id: true, nome: true } },
        cantieri_partenza: { select: { id: true, nome: true } },
        cantieri_arrivo: { select: { id: true, nome: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
      },
    });

    return NextResponse.json(
      { trasporto: serializeTrasporto(trasporto) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Errore nella creazione trasporto:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
