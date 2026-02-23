import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { markAttivitaUncheckedIfNonAdmin } from "@/lib/attivita-check";
import prisma from "@/lib/prisma";

function serializeInterazione(inter: { tempo_totale: bigint } & Record<string, unknown>) {
  const { tempo_totale, ...rest } = inter;
  return {
    ...rest,
    tempo_totale: typeof tempo_totale === "bigint" ? tempo_totale.toString() : tempo_totale,
  };
}

// GET /api/interazioni/[id]
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
    const interazioneId = parseInt(id, 10);

    if (Number.isNaN(interazioneId)) {
      return NextResponse.json(
        { error: "ID interazione non valido" },
        { status: 400 },
      );
    }

    const interazione = await prisma.interazioni.findUnique({
      where: { id: interazioneId },
      include: {
        user: { select: { id: true, name: true } },
        mezzi: { select: { id: true, nome: true } },
        attrezzature: { select: { id: true, nome: true } },
        cantieri: { select: { id: true, nome: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
        user_interazione_created_byTouser: { select: { id: true, name: true } },
        user_interazione_last_update_byTouser: { select: { id: true, name: true } },
      },
    });

    if (!interazione) {
      return NextResponse.json(
        { error: "Interazione non trovata" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      interazione: serializeInterazione(interazione),
    });
  } catch (error) {
    console.error("Errore nel recupero interazione:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/interazioni/[id]
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
    const interazioneId = parseInt(id, 10);

    if (Number.isNaN(interazioneId)) {
      return NextResponse.json(
        { error: "ID interazione non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.interazioni.findUnique({
      where: { id: interazioneId },
      select: { ore: true, minuti: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Interazione non trovata" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { ore, minuti, mezzi_id, attrezzature_id, cantieri_id, attivita_id, note } = body;

    const finalOre = ore !== undefined ? Number(ore) : existing.ore;
    const finalMinuti = minuti !== undefined ? Number(minuti) : existing.minuti;

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
    if (cantieri_id !== undefined) {
      const cid = Number(cantieri_id);
      if (Number.isNaN(cid) || cid < 1) {
        return NextResponse.json(
          { error: "Il cantiere deve essere un ID valido (maggiore di 0)" },
          { status: 400 },
        );
      }
    }

    const tempo_totale = BigInt((finalOre * 60 + finalMinuti) * 60000);
    const userId = session.user.id as string;

    const updateData: {
      ore: number;
      minuti: number;
      tempo_totale: bigint;
      last_update_at: Date;
      last_update_by: string;
      note?: string | null;
      mezzi_id?: number | null;
      attrezzature_id?: number | null;
      cantieri_id?: number;
      attivita_id?: number;
    } = {
      ore: finalOre,
      minuti: finalMinuti,
      tempo_totale,
      last_update_at: new Date(),
      last_update_by: userId,
    };

    if (note !== undefined) updateData.note = typeof note === "string" ? note : null;
    if (mezzi_id !== undefined) updateData.mezzi_id = mezzi_id != null ? Number(mezzi_id) : null;
    if (attrezzature_id !== undefined) updateData.attrezzature_id = attrezzature_id != null ? Number(attrezzature_id) : null;
    if (cantieri_id !== undefined) updateData.cantieri_id = Number(cantieri_id);
    if (attivita_id !== undefined) updateData.attivita_id = Number(attivita_id);

    const interazione = await prisma.interazioni.update({
      where: { id: interazioneId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
        mezzi: { select: { id: true, nome: true } },
        attrezzature: { select: { id: true, nome: true } },
        cantieri: { select: { id: true, nome: true } },
        attivita: { select: { id: true, date: true, external_id: true } },
      },
    });

    const attivitaId = updateData.attivita_id ?? interazione.attivita.id;
    await markAttivitaUncheckedIfNonAdmin(prisma, attivitaId, session);

    return NextResponse.json({
      interazione: serializeInterazione(interazione),
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento interazione:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/interazioni/[id]
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
    const interazioneId = parseInt(id, 10);

    if (Number.isNaN(interazioneId)) {
      return NextResponse.json(
        { error: "ID interazione non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.interazioni.findUnique({
      where: { id: interazioneId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Interazione non trovata" },
        { status: 404 },
      );
    }

    await prisma.interazioni.delete({
      where: { id: interazioneId },
    });

    await markAttivitaUncheckedIfNonAdmin(prisma, existing.attivita_id, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'eliminazione interazione:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
