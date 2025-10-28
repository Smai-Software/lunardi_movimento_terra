"use server";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const getUserAttivitaLast7Days = unstable_cache(
  async (userId: string) => {
    // Calculate 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const attivita = await prisma.attivita.findMany({
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
        interazioni: {
          select: {
            cantieri_id: true,
            mezzi_id: true,
            tempo_totale: true,
          },
        },
      },
      where: {
        user_id: userId,
        created_at: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Calculate aggregated counts and total milliseconds for each attivita
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

    return attivitaWithCounts;
  },
  ["user-attivita"],
  { tags: ["attivita", "all"], revalidate: 60 },
);

export const getUserCantieriForActivity = async (userId: string) => {
  const cantieri = await prisma.cantieri.findMany({
    relationLoadStrategy: "join",
    select: {
      id: true,
      nome: true,
      descrizione: true,
      open: true,
    },
    where: {
      user_cantieri: {
        some: {
          user_id: userId,
        },
      },
      open: true, // Only show open cantieri
    },
    orderBy: {
      nome: "asc",
    },
  });

  return cantieri;
};

export const getUserMezziForActivity = async (userId: string) => {
  const mezzi = await prisma.mezzi.findMany({
    relationLoadStrategy: "join",
    select: {
      id: true,
      nome: true,
      descrizione: true,
      has_license_camion: true,
      has_license_escavatore: true,
    },
    where: {
      user_mezzi: {
        some: {
          user_id: userId,
        },
      },
    },
    orderBy: {
      nome: "asc",
    },
  });

  return mezzi;
};

export type UserAttivita = NonNullable<
  Awaited<ReturnType<typeof getUserAttivitaLast7Days>>
>[number];
