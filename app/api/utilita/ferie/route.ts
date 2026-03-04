import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const MAX_DAYS = 366;

function toDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(s: string): Date | null {
  const d = new Date(s + "T12:00:00.000Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

function getEligibleDates(
  dateFrom: string,
  dateTo: string,
  includeSaturday: boolean,
): string[] {
  const from = parseDate(dateFrom);
  const to = parseDate(dateTo);
  if (!from || !to || from > to) return [];

  const out: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    const day = cur.getUTCDay();
    if (day !== 0 && (day !== 6 || includeSaturday)) {
      out.push(toDateOnly(cur));
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

// POST /api/utilita/ferie - Admin-only: crea attività con assenza FERIE 8h per intervallo date
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Solo gli amministratori possono usare questa funzione" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      user_id,
      dateFrom,
      dateTo,
      includeSaturday,
    } = body as {
      user_id?: string;
      dateFrom?: string;
      dateTo?: string;
      includeSaturday?: boolean;
    };

    if (!user_id || typeof user_id !== "string" || user_id.trim() === "") {
      return NextResponse.json(
        { error: "Operatore obbligatorio" },
        { status: 400 },
      );
    }

    if (!dateFrom || typeof dateFrom !== "string" || !dateTo || typeof dateTo !== "string") {
      return NextResponse.json(
        { error: "Intervallo date obbligatorio (dateFrom, dateTo)" },
        { status: 400 },
      );
    }

    const from = parseDate(dateFrom);
    const to = parseDate(dateTo);
    if (!from || !to) {
      return NextResponse.json(
        { error: "Formato date non valido (usare YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    if (from > to) {
      return NextResponse.json(
        { error: "La data di inizio deve essere uguale o precedente alla data di fine" },
        { status: 400 },
      );
    }

    const eligible = getEligibleDates(
      dateFrom,
      dateTo,
      includeSaturday === true,
    );
    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "Nessun giorno eleggibile nell'intervallo" },
        { status: 400 },
      );
    }
    if (eligible.length > MAX_DAYS) {
      return NextResponse.json(
        { error: `Intervallo troppo ampio (massimo ${MAX_DAYS} giorni eleggibili)` },
        { status: 400 },
      );
    }

    const operator = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, role: true },
    });
    if (!operator || operator.role === "admin") {
      return NextResponse.json(
        { error: "Operatore non valido o non trovato" },
        { status: 400 },
      );
    }

    const adminId = session.user.id as string;

    const dateObjects: Date[] = [];
    for (const d of eligible) {
      const parsed = parseDate(d);
      if (!parsed) {
        return NextResponse.json(
          { error: "Data non valida nell'intervallo" },
          { status: 400 },
        );
      }
      dateObjects.push(parsed);
    }

    const eligibleSet = new Set(eligible);
    const firstDay = eligible[0];
    const lastDay = eligible[eligible.length - 1];
    if (!firstDay || !lastDay) {
      return NextResponse.json(
        { error: "Intervallo date non valido" },
        { status: 400 },
      );
    }
    const rangeStart = new Date(firstDay + "T00:00:00.000Z");
    const rangeEnd = new Date(lastDay + "T23:59:59.999Z");

    const existing = await prisma.attivita.findMany({
      where: {
        user_id,
        date: { gte: rangeStart, lte: rangeEnd },
      },
      select: { date: true },
    });

    const conflictingDates = existing
      .map((a) => toDateOnly(a.date instanceof Date ? a.date : new Date(a.date)))
      .filter((d) => eligibleSet.has(d));

    if (conflictingDates.length > 0) {
      return NextResponse.json(
        {
          error: "Esistono già attività per alcune date nell'intervallo",
          conflicts: conflictingDates,
        },
        { status: 409 },
      );
    }

    const createdDates: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const dateStr of eligible) {
        const dateValue = parseDate(dateStr);
        if (!dateValue) continue;
        const att = await tx.attivita.create({
          data: {
            date: dateValue,
            user_id,
            external_id: randomUUID(),
            created_by: adminId,
            last_update_by: adminId,
            created_at: new Date(),
            last_update_at: new Date(),
            is_checked: true,
            ore_effettive: 0,
            minuti_effettivi: 0,
            tempo_totale_effettivo: BigInt(0),
          },
        });
        await tx.assenze.create({
          data: {
            tipo: "FERIE",
            ore: 8,
            minuti: 0,
            tempo_totale: BigInt(8 * 60 * 60000),
            user_id,
            attivita_id: att.id,
            external_id: randomUUID(),
            created_by: adminId,
            last_update_by: adminId,
            created_at: new Date(),
            last_update_at: new Date(),
            note: null,
          },
        });
        createdDates.push(dateStr);
      }
    });

    return NextResponse.json(
      { createdCount: createdDates.length, dates: createdDates },
      { status: 201 },
    );
  } catch (err) {
    console.error("Errore inserimento ferie:", err);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
