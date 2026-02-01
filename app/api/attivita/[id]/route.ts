import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function serializeAttivita(attivita: {
  interazioni?: { tempo_totale: bigint }[];
  [key: string]: unknown;
}) {
  const { interazioni, ...rest } = attivita;
  const result = { ...rest } as Record<string, unknown>;
  if (Array.isArray(interazioni)) {
    result.interazioni = interazioni.map((i) => ({
      ...i,
      tempo_totale: typeof i.tempo_totale === "bigint" ? i.tempo_totale.toString() : i.tempo_totale,
    }));
  }
  return result;
}

// GET /api/attivita/[id]
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
    const attivitaId = parseInt(id, 10);

    if (Number.isNaN(attivitaId)) {
      return NextResponse.json(
        { error: "ID attivita non valido" },
        { status: 400 },
      );
    }

    const attivita = await prisma.attivita.findUnique({
      where: { id: attivitaId },
      include: {
        user: { select: { id: true, name: true } },
        user_attivita_created_byTouser: { select: { id: true, name: true } },
        user_attivita_last_update_byTouser: { select: { id: true, name: true } },
        interazioni: {
          select: {
            id: true,
            ore: true,
            minuti: true,
            tempo_totale: true,
            note: true,
            cantieri_id: true,
            mezzi_id: true,
            cantieri: { select: { id: true, nome: true } },
            mezzi: { select: { id: true, nome: true } },
          },
        },
      },
    });

    if (!attivita) {
      return NextResponse.json(
        { error: "Attivita non trovata" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      attivita: serializeAttivita(attivita),
    });
  } catch (error) {
    console.error("Errore nel recupero attivita:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/attivita/[id] - Aggiorna attivita (con o senza interazioni)
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
    const attivitaId = parseInt(id, 10);

    if (Number.isNaN(attivitaId)) {
      return NextResponse.json(
        { error: "ID attivita non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.attivita.findUnique({
      where: { id: attivitaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attivita non trovata" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { date, user_id, interazioni } = body;

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "La data è obbligatoria" },
        { status: 400 },
      );
    }
    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        { error: "L'utente è obbligatorio" },
        { status: 400 },
      );
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Data non valida" },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;

    if (interazioni && Array.isArray(interazioni) && interazioni.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.attivita.update({
          where: { id: attivitaId },
          data: {
            date: parsedDate,
            user_id,
            last_update_at: new Date(),
            last_update_by: userId,
          },
        });

        await tx.interazioni.deleteMany({
          where: { attivita_id: attivitaId },
        });

        await tx.interazioni.createMany({
          data: interazioni.map(
            (inter: {
              cantieri_id: number;
              mezzi_id?: number | null;
              ore: number;
              minuti: number;
              note?: string;
            }) => {
              const ore = Number(inter.ore) || 0;
              const minuti = Math.min(
                59,
                Math.max(0, Number(inter.minuti) || 0),
              );
              return {
                ore,
                minuti,
                tempo_totale: BigInt((ore * 60 + minuti) * 60000),
                user_id,
                mezzi_id: inter.mezzi_id ?? null,
                cantieri_id: inter.cantieri_id,
                attivita_id: attivitaId,
                external_id: randomUUID(),
                created_at: new Date(),
                last_update_at: new Date(),
                created_by: userId,
                last_update_by: userId,
                note: inter.note || null,
              };
            },
          ),
        });
      });
    } else {
      await prisma.attivita.update({
        where: { id: attivitaId },
        data: {
          date: parsedDate,
          user_id,
          last_update_at: new Date(),
          last_update_by: userId,
        },
      });
    }

    const updated = await prisma.attivita.findUnique({
      where: { id: attivitaId },
      include: {
        user: { select: { id: true, name: true } },
        interazioni: { select: { cantieri_id: true, mezzi_id: true, tempo_totale: true } },
      },
    });

    return NextResponse.json({
      attivita: updated ? serializeAttivita(updated) : null,
    });
  } catch (error) {
    console.error("Errore nell'aggiornamento attivita:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/attivita/[id]
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
    const attivitaId = parseInt(id, 10);

    if (Number.isNaN(attivitaId)) {
      return NextResponse.json(
        { error: "ID attivita non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.attivita.findUnique({
      where: { id: attivitaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attivita non trovata" },
        { status: 404 },
      );
    }

    await prisma.attivita.delete({
      where: { id: attivitaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'eliminazione attivita:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
