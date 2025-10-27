"use server";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { subDays } from "date-fns";

export const getDashboardData = unstable_cache(
  async (days: number = 30) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Get all attività in the period
    const attivita = await prisma.attivita.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      relationLoadStrategy: "join",
      select: {
        id: true,
        date: true,
        user_id: true,
        external_id: true,
        created_at: true,
        last_update_at: true,
        created_by: true,
        last_update_by: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        user_attivita_created_byTouser: {
          select: {
            id: true,
            name: true,
          },
        },
        user_attivita_last_update_byTouser: {
          select: {
            id: true,
            name: true,
          },
        },
        interazioni: {
          select: {
            cantieri_id: true,
            mezzi_id: true,
            tempo_totale: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate aggregated counts for each attivita
    const attivitaWithCounts = attivita.map((attivita) => {
      const uniqueCantieri = new Set(
        attivita.interazioni.map((i) => i.cantieri_id),
      );
      const uniqueMezzi = new Set(
        attivita.interazioni.filter((i) => i.mezzi_id).map((i) => i.mezzi_id),
      );
      const totalMilliseconds = attivita.interazioni.reduce(
        (sum, i) => sum + Number(i.tempo_totale),
        0,
      );

      return {
        ...attivita,
        cantieriCount: uniqueCantieri.size,
        mezziCount: uniqueMezzi.size,
        totalMilliseconds,
        interazioni: attivita.interazioni.map((interazione) => ({
          ...interazione,
          tempo_totale: interazione.tempo_totale.toString(),
        })),
      };
    });

    // Get all interazioni in the period to count unique cantieri and mezzi
    const interazioni = await prisma.interazioni.findMany({
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
    });

    // Count unique cantieri with at least one interazione
    const uniqueCantieri = new Set(interazioni.map((i) => i.cantieri_id));

    // Count unique mezzi with at least one interazione
    const uniqueMezzi = new Set(
      interazioni.filter((i) => i.mezzi_id).map((i) => i.mezzi_id),
    );

    return {
      attivita: attivitaWithCounts,
      attivitaCount: attivita.length,
      cantieriCount: uniqueCantieri.size,
      mezziCount: uniqueMezzi.size,
    };
  },
  ["dashboard-data"],
  { tags: ["dashboard", "attivita", "all"], revalidate: 60 },
);

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
