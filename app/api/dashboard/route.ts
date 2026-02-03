import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { subDays } from "date-fns";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/dashboard - Statistiche dashboard (attivita, cantieri, mezzi nel periodo)
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
    const daysParam = searchParams.get("days") || "30";
    const days = Math.min(365, Math.max(1, parseInt(daysParam, 10) || 30));

    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const [attivitaList, interazioni, trasportiInPeriod] = await Promise.all([
      prisma.attivita.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          date: true,
          user_id: true,
          external_id: true,
          created_at: true,
          last_update_at: true,
          user: { select: { id: true, name: true } },
          user_attivita_created_byTouser: { select: { id: true, name: true } },
          user_attivita_last_update_byTouser: { select: { id: true, name: true } },
          interazioni: {
            select: {
              cantieri_id: true,
              mezzi_id: true,
              tempo_totale: true,
            },
          },
          assenze: {
            select: { tempo_totale: true },
          },
          trasporti: {
            select: {
              cantieri_partenza_id: true,
              cantieri_arrivo_id: true,
              mezzi_id: true,
              tempo_totale: true,
            },
          },
        },
        orderBy: { date: "desc" },
      }),
      prisma.interazioni.findMany({
        where: {
          attivita: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        select: {
          cantieri_id: true,
          mezzi_id: true,
        },
      }),
      prisma.trasporti.findMany({
        where: {
          attivita: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        select: {
          cantieri_partenza_id: true,
          cantieri_arrivo_id: true,
          mezzi_id: true,
        },
      }),
    ]);

    const attivitaWithCounts = attivitaList.map((a) => {
      const uniqueCantieri = new Set(a.interazioni.map((i) => i.cantieri_id));
      const uniqueMezzi = new Set(
        a.interazioni.filter((i) => i.mezzi_id).map((i) => i.mezzi_id),
      );
      for (const t of a.trasporti ?? []) {
        uniqueCantieri.add(t.cantieri_partenza_id);
        uniqueCantieri.add(t.cantieri_arrivo_id);
        uniqueMezzi.add(t.mezzi_id);
      }
      const interazioniMs = a.interazioni.reduce(
        (sum, i) => sum + Number(i.tempo_totale),
        0,
      );
      const assenzeMs = (a.assenze ?? []).reduce(
        (sum, ass) => sum + Number(ass.tempo_totale),
        0,
      );
      const trasportiMs = (a.trasporti ?? []).reduce(
        (sum, t) => sum + Number(t.tempo_totale),
        0,
      );
      const totalMilliseconds = interazioniMs + assenzeMs + trasportiMs;
      return {
        ...a,
        cantieriCount: uniqueCantieri.size,
        mezziCount: uniqueMezzi.size,
        totalMilliseconds,
        interazioni: a.interazioni.map((i) => ({
          ...i,
          tempo_totale: i.tempo_totale.toString(),
        })),
        assenze: (a.assenze ?? []).map((ass) => ({
          ...ass,
          tempo_totale: ass.tempo_totale.toString(),
        })),
        trasporti: (a.trasporti ?? []).map((t) => ({
          ...t,
          tempo_totale: t.tempo_totale.toString(),
        })),
      };
    });

    const uniqueCantieri = new Set(interazioni.map((i) => i.cantieri_id));
    const uniqueMezzi = new Set(
      interazioni.filter((i) => i.mezzi_id).map((i) => i.mezzi_id),
    );
    for (const t of trasportiInPeriod) {
      uniqueCantieri.add(t.cantieri_partenza_id);
      uniqueCantieri.add(t.cantieri_arrivo_id);
      uniqueMezzi.add(t.mezzi_id);
    }

    return NextResponse.json({
      attivita: attivitaWithCounts,
      attivitaCount: attivitaList.length,
      cantieriCount: uniqueCantieri.size,
      mezziCount: uniqueMezzi.size,
      days,
    });
  } catch (error) {
    console.error("Errore nel recupero dashboard:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
