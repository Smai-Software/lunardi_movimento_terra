import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import type { assenza_tipo } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { checkAttivitaDateRangeForUser } from "@/lib/attivita-date-range-guard";
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
    const { date, user_id, interazioni, assenze, trasporti } = body;

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

    const dateRangeError = checkAttivitaDateRangeForUser(session, parsedDate);
    if (dateRangeError) return dateRangeError;

    const userId = session.user.id as string;
    const hasInterazioni = interazioni && Array.isArray(interazioni);
    const hasAssenze = assenze && Array.isArray(assenze);
    const hasTrasporti = trasporti && Array.isArray(trasporti);

    const isChecked = session.user.role === "admin";
    await prisma.$transaction(async (tx) => {
      await tx.attivita.update({
        where: { id: attivitaId },
        data: {
          date: parsedDate,
          user_id,
          last_update_at: new Date(),
          last_update_by: userId,
          ...(isChecked ? {} : { is_checked: false }),
        },
      });

      if (hasInterazioni) {
        await tx.interazioni.deleteMany({
          where: { attivita_id: attivitaId },
        });
        if (interazioni.length > 0) {
          await tx.interazioni.createMany({
            data: interazioni.map(
              (inter: {
                cantieri_id: number;
                mezzi_id?: number | null;
                attrezzature_id?: number | null;
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
                  attrezzature_id: inter.attrezzature_id ?? null,
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
        }
      }

      if (hasAssenze) {
        await tx.assenze.deleteMany({
          where: { attivita_id: attivitaId },
        });
        if (assenze.length > 0) {
          await tx.assenze.createMany({
            data: assenze.map(
              (ass: {
                tipo: string;
                ore?: number;
                minuti?: number;
                note?: string;
              }) => {
                const ore = ass.ore !== undefined && ass.ore !== null ? Number(ass.ore) : 8;
                const minuti =
                  ass.minuti !== undefined && ass.minuti !== null
                    ? Math.min(59, Math.max(0, Number(ass.minuti)))
                    : 0;
                return {
                  tipo: ass.tipo as assenza_tipo,
                  ore,
                  minuti,
                  tempo_totale: BigInt((ore * 60 + minuti) * 60000),
                  user_id,
                  attivita_id: attivitaId,
                  external_id: randomUUID(),
                  created_at: new Date(),
                  last_update_at: new Date(),
                  created_by: userId,
                  last_update_by: userId,
                  note: typeof ass.note === "string" ? ass.note : null,
                };
              },
            ),
          });
        }
      }

      if (hasTrasporti) {
        await tx.trasporti.deleteMany({
          where: { attivita_id: attivitaId },
        });
        if (trasporti.length > 0) {
          const [userCantieriRows, userMezziRows] = await Promise.all([
            tx.user_cantieri.findMany({
              where: { user_id },
              select: { cantieri_id: true },
            }),
            tx.user_mezzi.findMany({
              where: { user_id },
              select: { mezzi_id: true },
            }),
          ]);
          const allowedCantieri = new Set(userCantieriRows.map((r) => r.cantieri_id));
          const allowedMezzi = new Set(userMezziRows.map((r) => r.mezzi_id));
          for (const tr of trasporti as Array<{
            cantieri_partenza_id: number;
            cantieri_arrivo_id: number;
            mezzi_id: number;
            mezzi_trasportato_id?: number | null;
            attrezzature_id?: number | null;
            ore: number;
            minuti: number;
            note?: string;
          }>) {
            const partenzaId = Number(tr.cantieri_partenza_id);
            const arrivoId = Number(tr.cantieri_arrivo_id);
            const mezzoId = Number(tr.mezzi_id);
            if (!allowedCantieri.has(partenzaId)) {
              throw new Error("Cantiere partenza non assegnato all'utente");
            }
            if (!allowedCantieri.has(arrivoId)) {
              throw new Error("Cantiere arrivo non assegnato all'utente");
            }
            if (!allowedMezzi.has(mezzoId)) {
              throw new Error("Mezzo non assegnato all'utente");
            }
          }
          await tx.trasporti.createMany({
            data: (trasporti as Array<{
              cantieri_partenza_id: number;
              cantieri_arrivo_id: number;
              mezzi_id: number;
              mezzi_trasportato_id?: number | null;
              attrezzature_id?: number | null;
              ore: number;
              minuti: number;
              note?: string;
            }>).map((tr) => {
              const ore = Number(tr.ore) || 0;
              const minuti = Math.min(59, Math.max(0, Number(tr.minuti) || 0));
              return {
                ore,
                minuti,
                tempo_totale: BigInt((ore * 60 + minuti) * 60000),
                user_id,
                attivita_id: attivitaId,
                mezzi_id: Number(tr.mezzi_id),
                mezzi_trasportato_id:
                  tr.mezzi_trasportato_id != null && typeof tr.mezzi_trasportato_id === "number"
                    ? tr.mezzi_trasportato_id
                    : null,
                attrezzature_id:
                  tr.attrezzature_id != null && typeof tr.attrezzature_id === "number"
                    ? tr.attrezzature_id
                    : null,
                cantieri_partenza_id: Number(tr.cantieri_partenza_id),
                cantieri_arrivo_id: Number(tr.cantieri_arrivo_id),
                external_id: randomUUID(),
                created_at: new Date(),
                last_update_at: new Date(),
                created_by: userId,
                last_update_by: userId,
                note: typeof tr.note === "string" ? tr.note : null,
              };
            }),
          });
        }
      }
    });

    const updated = await prisma.attivita.findUnique({
      where: { id: attivitaId },
      include: {
        user: { select: { id: true, name: true } },
        interazioni: { select: { cantieri_id: true, mezzi_id: true, tempo_totale: true } },
        assenze: { select: { tempo_totale: true } },
        trasporti: { select: { cantieri_partenza_id: true, cantieri_arrivo_id: true, mezzi_id: true, tempo_totale: true } },
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

    const dateRangeError = checkAttivitaDateRangeForUser(session, existing.date);
    if (dateRangeError) return dateRangeError;

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
