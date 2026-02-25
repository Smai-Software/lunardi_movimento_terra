import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { assenza_tipo } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { markAttivitaUncheckedIfNonAdmin } from "@/lib/attivita-check";
import { checkAttivitaDateRangeForUser } from "@/lib/attivita-date-range-guard";
import prisma from "@/lib/prisma";

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

// GET /api/assenze/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const assenzaId = parseInt(id, 10);

    if (Number.isNaN(assenzaId)) {
      return NextResponse.json(
        { error: "ID assenza non valido" },
        { status: 400 },
      );
    }

    const assenza = await prisma.assenze.findUnique({
      where: { id: assenzaId },
      include: {
        user: { select: { id: true, name: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
        user_assenza_created_byTouser: { select: { id: true, name: true } },
        user_assenza_last_update_byTouser: { select: { id: true, name: true } },
      },
    });

    if (!assenza) {
      return NextResponse.json(
        { error: "Assenza non trovata" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      assenza: serializeAssenza(assenza),
    });
  } catch (error) {
    console.error("Errore nel recupero assenza:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/assenze/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const assenzaId = parseInt(id, 10);

    if (Number.isNaN(assenzaId)) {
      return NextResponse.json(
        { error: "ID assenza non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.assenze.findUnique({
      where: { id: assenzaId },
      select: {
        ore: true,
        minuti: true,
        tipo: true,
        attivita_id: true,
        attivita: { select: { date: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assenza non trovata" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { tipo, ore, minuti, attivita_id, note } = body;

    const finalTipo =
      tipo !== undefined && tipo !== null && VALID_TIPI.includes(tipo)
        ? tipo
        : existing.tipo;
    const finalOre = ore !== undefined && ore !== null ? Number(ore) : existing.ore;
    const finalMinuti =
      minuti !== undefined && minuti !== null ? Number(minuti) : existing.minuti;

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

    const finalAttivitaId = attivita_id !== undefined ? Number(attivita_id) : existing.attivita_id;
    const attivitaToValidate =
      attivita_id !== undefined && attivita_id !== existing.attivita_id
        ? await prisma.attivita.findUnique({
            where: { id: finalAttivitaId },
            select: { date: true },
          })
        : existing.attivita;
    if (!attivitaToValidate) {
      return NextResponse.json(
        { error: "Attività non trovata" },
        { status: 404 },
      );
    }
    const dateRangeError = checkAttivitaDateRangeForUser(session, attivitaToValidate.date);
    if (dateRangeError) return dateRangeError;

    const tempo_totale = BigInt((finalOre * 60 + finalMinuti) * 60000);
    const userId = session.user.id as string;

    const updateData: {
      tipo: assenza_tipo;
      ore: number;
      minuti: number;
      tempo_totale: bigint;
      last_update_at: Date;
      last_update_by: string;
      note?: string | null;
      attivita_id?: number;
    } = {
      tipo: finalTipo as assenza_tipo,
      ore: finalOre,
      minuti: finalMinuti,
      tempo_totale,
      last_update_at: new Date(),
      last_update_by: userId,
    };

    if (note !== undefined) updateData.note = typeof note === "string" ? note : null;
    if (attivita_id !== undefined) updateData.attivita_id = Number(attivita_id);

    const assenza = await prisma.assenze.update({
      where: { id: assenzaId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
      },
    });

    const attivitaId = updateData.attivita_id ?? assenza.attivita.id;
    await markAttivitaUncheckedIfNonAdmin(prisma, attivitaId, session);

    return NextResponse.json({
      assenza: serializeAssenza(assenza),
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento assenza:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/assenze/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const assenzaId = parseInt(id, 10);

    if (Number.isNaN(assenzaId)) {
      return NextResponse.json(
        { error: "ID assenza non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.assenze.findUnique({
      where: { id: assenzaId },
      include: { attivita: { select: { date: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assenza non trovata" },
        { status: 404 },
      );
    }

    const dateRangeError = checkAttivitaDateRangeForUser(session, existing.attivita.date);
    if (dateRangeError) return dateRangeError;

    await prisma.assenze.delete({
      where: { id: assenzaId },
    });

    await markAttivitaUncheckedIfNonAdmin(prisma, existing.attivita_id, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'eliminazione assenza:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
