import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { markAttivitaUncheckedIfNonAdmin } from "@/lib/attivita-check";
import prisma from "@/lib/prisma";

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

// GET /api/trasporti/[id]
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
    const trasportoId = parseInt(id, 10);

    if (Number.isNaN(trasportoId)) {
      return NextResponse.json(
        { error: "ID trasporto non valido" },
        { status: 400 },
      );
    }

    const trasporto = await prisma.trasporti.findUnique({
      where: { id: trasportoId },
      include: {
        user: { select: { id: true, name: true } },
        mezzi: { select: { id: true, nome: true } },
        mezzi_trasportato: { select: { id: true, nome: true } },
        cantieri_partenza: { select: { id: true, nome: true } },
        cantieri_arrivo: { select: { id: true, nome: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
        user_trasporto_created_byTouser: { select: { id: true, name: true } },
        user_trasporto_last_update_byTouser: { select: { id: true, name: true } },
      },
    });

    if (!trasporto) {
      return NextResponse.json(
        { error: "Trasporto non trovato" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      trasporto: serializeTrasporto(trasporto),
    });
  } catch (error) {
    console.error("Errore nel recupero trasporto:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/trasporti/[id]
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
    const trasportoId = parseInt(id, 10);

    if (Number.isNaN(trasportoId)) {
      return NextResponse.json(
        { error: "ID trasporto non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.trasporti.findUnique({
      where: { id: trasportoId },
      select: {
        ore: true,
        minuti: true,
        user_id: true,
        cantieri_partenza_id: true,
        cantieri_arrivo_id: true,
        mezzi_id: true,
        mezzi_trasportato_id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Trasporto non trovato" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      ore,
      minuti,
      cantieri_partenza_id,
      cantieri_arrivo_id,
      mezzi_id,
      mezzi_trasportato_id,
      attivita_id,
      note,
    } = body;

    const finalOre = ore !== undefined ? Number(ore) : existing.ore;
    const finalMinuti = minuti !== undefined ? Number(minuti) : existing.minuti;
    const finalPartenza =
      cantieri_partenza_id !== undefined ? Number(cantieri_partenza_id) : existing.cantieri_partenza_id;
    const finalArrivo =
      cantieri_arrivo_id !== undefined ? Number(cantieri_arrivo_id) : existing.cantieri_arrivo_id;
    const finalMezzo = mezzi_id !== undefined ? Number(mezzi_id) : existing.mezzi_id;
    const finalMezzoTrasportato =
      mezzi_trasportato_id !== undefined
        ? mezzi_trasportato_id != null
          ? Number(mezzi_trasportato_id)
          : null
        : existing.mezzi_trasportato_id;

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
    const check = await checkUserAssignments(
      existing.user_id,
      finalPartenza,
      finalArrivo,
      finalMezzo,
    );
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const tempo_totale = BigInt((finalOre * 60 + finalMinuti) * 60000);
    const userId = session.user.id as string;

    const updateData: {
      ore: number;
      minuti: number;
      tempo_totale: bigint;
      last_update_at: Date;
      last_update_by: string;
      cantieri_partenza_id: number;
      cantieri_arrivo_id: number;
      mezzi_id: number;
      mezzi_trasportato_id: number | null;
      note?: string | null;
      attivita_id?: number;
    } = {
      ore: finalOre,
      minuti: finalMinuti,
      tempo_totale,
      last_update_at: new Date(),
      last_update_by: userId,
      cantieri_partenza_id: finalPartenza,
      cantieri_arrivo_id: finalArrivo,
      mezzi_id: finalMezzo,
      mezzi_trasportato_id: finalMezzoTrasportato,
    };

    if (note !== undefined) updateData.note = typeof note === "string" ? note : null;
    if (attivita_id !== undefined) updateData.attivita_id = Number(attivita_id);

    const trasporto = await prisma.trasporti.update({
      where: { id: trasportoId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
        mezzi: { select: { id: true, nome: true } },
        mezzi_trasportato: { select: { id: true, nome: true } },
        cantieri_partenza: { select: { id: true, nome: true } },
        cantieri_arrivo: { select: { id: true, nome: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
      },
    });

    const attivitaId = updateData.attivita_id ?? trasporto.attivita.id;
    await markAttivitaUncheckedIfNonAdmin(prisma, attivitaId, session);

    return NextResponse.json({
      trasporto: serializeTrasporto(trasporto),
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento trasporto:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/trasporti/[id]
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
    const trasportoId = parseInt(id, 10);

    if (Number.isNaN(trasportoId)) {
      return NextResponse.json(
        { error: "ID trasporto non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.trasporti.findUnique({
      where: { id: trasportoId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Trasporto non trovato" },
        { status: 404 },
      );
    }

    await prisma.trasporti.delete({
      where: { id: trasportoId },
    });

    await markAttivitaUncheckedIfNonAdmin(prisma, existing.attivita_id, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'eliminazione trasporto:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
