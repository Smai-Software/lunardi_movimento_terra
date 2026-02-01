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

    const [attivitaList, interazioni] = await Promise.all([
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
    ]);

    const attivitaWithCounts = attivitaList.map((a) => {
      const uniqueCantieri = new Set(a.interazioni.map((i) => i.cantieri_id));
      const uniqueMezzi = new Set(
        a.interazioni.filter((i) => i.mezzi_id).map((i) => i.mezzi_id),
      );
      const totalMilliseconds = a.interazioni.reduce(
        (sum, i) => sum + Number(i.tempo_totale),
        0,
      );
      return {
        ...a,
        cantieriCount: uniqueCantieri.size,
        mezziCount: uniqueMezzi.size,
        totalMilliseconds,
        interazioni: a.interazioni.map((i) => ({
          ...i,
          tempo_totale: i.tempo_totale.toString(),
        })),
      };
    });

    const uniqueCantieri = new Set(interazioni.map((i) => i.cantieri_id));
    const uniqueMezzi = new Set(
      interazioni.filter((i) => i.mezzi_id).map((i) => i.mezzi_id),
    );

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
