import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { markAttivitaUncheckedIfNonAdmin } from "@/lib/attivita-check";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function serializeInterazione(inter: { tempo_totale: bigint } & Record<string, unknown>) {
  const { tempo_totale, ...rest } = inter;
  return {
    ...rest,
    tempo_totale: typeof tempo_totale === "bigint" ? tempo_totale.toString() : tempo_totale,
  };
}

// GET /api/interazioni - Lista interazioni con paginazione e filtri
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

    const where: { attivita_id?: number; cantieri_id?: number } = {};
    if (attivitaIdParam) {
      const attivitaId = parseInt(attivitaIdParam, 10);
      if (!Number.isNaN(attivitaId)) where.attivita_id = attivitaId;
    }
    if (cantiereIdParam) {
      const cantiereId = parseInt(cantiereIdParam, 10);
      if (!Number.isNaN(cantiereId)) where.cantieri_id = cantiereId;
    }

    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortOrder === "desc" ? "desc" : "asc",
    };

    const [interazioniList, total] = await Promise.all([
      prisma.interazioni.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
          mezzi: { select: { id: true, nome: true } },
          attrezzature: { select: { id: true, nome: true } },
          cantieri: { select: { id: true, nome: true } },
          attivita: { select: { id: true, date: true, external_id: true } },
          user_interazione_created_byTouser: { select: { id: true, name: true } },
          user_interazione_last_update_byTouser: { select: { id: true, name: true } },
        },
      }),
      prisma.interazioni.count({ where }),
    ]);

    const serialized = interazioniList.map(serializeInterazione);

    return NextResponse.json({
      interazioni: serialized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore nel recupero interazioni:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/interazioni - Crea interazione
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
    const { ore, minuti, user_id, mezzi_id, attrezzature_id, cantieri_id, attivita_id, note } = body;

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
    if (!cantieri_id || typeof cantieri_id !== "number") {
      return NextResponse.json(
        { error: "Il cantiere è obbligatorio" },
        { status: 400 },
      );
    }
    if (!attivita_id || typeof attivita_id !== "number") {
      return NextResponse.json(
        { error: "L'attività è obbligatoria" },
        { status: 400 },
      );
    }

    const tempo_totale = BigInt((ore * 60 + minuti) * 60000);
    const userId = session.user.id as string;

    const interazione = await prisma.interazioni.create({
      data: {
        ore,
        minuti,
        tempo_totale,
        note: typeof note === "string" ? note : null,
        user_id,
        mezzi_id: mezzi_id != null ? Number(mezzi_id) : null,
        attrezzature_id: attrezzature_id != null ? Number(attrezzature_id) : null,
        cantieri_id,
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
        attrezzature: { select: { id: true, nome: true } },
        cantieri: { select: { id: true, nome: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
      },
    });

    await markAttivitaUncheckedIfNonAdmin(prisma, attivita_id, session);

    return NextResponse.json(
      { interazione: serializeInterazione(interazione) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Errore nella creazione interazione:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
