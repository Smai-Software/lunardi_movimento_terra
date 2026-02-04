import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { assenza_tipo } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ASSENZA_TIPI: assenza_tipo[] = [
  "FERIE",
  "PERMESSO",
  "CASSA_INTEGRAZIONE",
  "MUTUA",
  "PATERNITA",
];

function parseDateYYYYMMDD(s: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  const date = new Date(y, m, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

// GET /api/report - Report ore utente (interazioni + trasporti + assenze) per range date
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Solo gli admin possono accedere al report" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId")?.trim() || "";
    const startDateStr = searchParams.get("startDate")?.trim() || "";
    const endDateStr = searchParams.get("endDate")?.trim() || "";

    if (!userId) {
      return NextResponse.json(
        { error: "Parametro userId obbligatorio" },
        { status: 400 },
      );
    }
    if (!startDateStr) {
      return NextResponse.json(
        { error: "Parametro startDate obbligatorio (YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    if (!endDateStr) {
      return NextResponse.json(
        { error: "Parametro endDate obbligatorio (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const startDate = parseDateYYYYMMDD(startDateStr);
    const endDate = parseDateYYYYMMDD(endDateStr);
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Formato date non valido (usare YYYY-MM-DD)" },
        { status: 400 },
      );
    }
    if (startDate > endDate) {
      return NextResponse.json(
        { error: "startDate deve essere <= endDate" },
        { status: 400 },
      );
    }

    const endExclusive = new Date(endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);

    const dateFilter = {
      gte: startDate,
      lt: endExclusive,
    };

    const [user, interazioniList, trasportiList, assenzeList] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true },
      }),
      prisma.interazioni.findMany({
        where: {
          user_id: userId,
          attivita: { date: dateFilter },
        },
        select: { tempo_totale: true },
      }),
      prisma.trasporti.findMany({
        where: {
          user_id: userId,
          attivita: { date: dateFilter },
        },
        select: { tempo_totale: true },
      }),
      prisma.assenze.findMany({
        where: {
          user_id: userId,
          attivita: { date: dateFilter },
        },
        select: { tipo: true, tempo_totale: true },
      }),
    ]);

    if (!user || user.role === "admin") {
      return NextResponse.json(
        { error: "Utente non trovato o non autorizzato" },
        { status: 404 },
      );
    }

    let interazioniMs = BigInt(0);
    for (const i of interazioniList) {
      interazioniMs += i.tempo_totale;
    }
    let trasportiMs = BigInt(0);
    for (const t of trasportiList) {
      trasportiMs += t.tempo_totale;
    }
    let assenzeMs = BigInt(0);
    const assenzeByTipoMs: Record<assenza_tipo, bigint> = {
      FERIE: BigInt(0),
      PERMESSO: BigInt(0),
      CASSA_INTEGRAZIONE: BigInt(0),
      MUTUA: BigInt(0),
      PATERNITA: BigInt(0),
    };
    for (const a of assenzeList) {
      assenzeMs += a.tempo_totale;
      assenzeByTipoMs[a.tipo] = (assenzeByTipoMs[a.tipo] ?? BigInt(0)) + a.tempo_totale;
    }
    const overallMs = interazioniMs + trasportiMs + assenzeMs;

    const assenzeByTipoMsStrings: Record<string, string> = {};
    for (const t of ASSENZA_TIPI) {
      assenzeByTipoMsStrings[t] = assenzeByTipoMs[t].toString();
    }

    return NextResponse.json({
      user: { id: user.id, name: user.name },
      range: { startDate: startDateStr, endDate: endDateStr },
      totals: {
        interazioniMs: interazioniMs.toString(),
        trasportiMs: trasportiMs.toString(),
        assenzeMs: assenzeMs.toString(),
        overallMs: overallMs.toString(),
      },
      assenzeByTipoMs: assenzeByTipoMsStrings,
    });
  } catch (error) {
    console.error("Errore nel report:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
