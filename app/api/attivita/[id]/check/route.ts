import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function serializeAttivita(attivita: {
  interazioni?: { tempo_totale: bigint }[];
  assenze?: { tempo_totale: bigint }[];
  trasporti?: { tempo_totale: bigint }[];
  [key: string]: unknown;
}) {
  const { interazioni, assenze, trasporti, ...rest } = attivita;
  const result = { ...rest } as Record<string, unknown>;
  if (Array.isArray(interazioni)) {
    result.interazioni = interazioni.map((i) => ({
      ...i,
      tempo_totale: typeof i.tempo_totale === "bigint" ? i.tempo_totale.toString() : i.tempo_totale,
    }));
  }
  if (Array.isArray(assenze)) {
    result.assenze = assenze.map((a) => ({
      ...a,
      tempo_totale: typeof a.tempo_totale === "bigint" ? a.tempo_totale.toString() : a.tempo_totale,
    }));
  }
  if (Array.isArray(trasporti)) {
    result.trasporti = trasporti.map((t) => ({
      ...t,
      tempo_totale: typeof t.tempo_totale === "bigint" ? t.tempo_totale.toString() : t.tempo_totale,
    }));
  }
  return result;
}

// PATCH /api/attivita/[id]/check - Admin-only: imposta is_checked=true
export async function PATCH(
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Solo gli admin possono registrare l'attività" },
        { status: 403 },
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

    const userId = session.user.id as string;
    const updated = await prisma.attivita.update({
      where: { id: attivitaId },
      data: {
        is_checked: true,
        last_update_at: new Date(),
        last_update_by: userId,
      },
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
        assenze: {
          select: {
            id: true,
            tipo: true,
            ore: true,
            minuti: true,
            tempo_totale: true,
            note: true,
            created_at: true,
            user: { select: { id: true, name: true } },
            attivita: { select: { id: true, date: true } },
          },
        },
        trasporti: {
          select: {
            id: true,
            ore: true,
            minuti: true,
            tempo_totale: true,
            note: true,
            cantieri_partenza_id: true,
            cantieri_arrivo_id: true,
            mezzi_id: true,
            cantieri_partenza: { select: { id: true, nome: true } },
            cantieri_arrivo: { select: { id: true, nome: true } },
            mezzi: { select: { id: true, nome: true } },
          },
        },
      },
    });

    return NextResponse.json({
      attivita: serializeAttivita(updated),
    });
  } catch (error) {
    console.error("Errore nella registrazione attivita:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
