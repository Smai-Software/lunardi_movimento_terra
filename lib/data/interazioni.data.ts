"use server";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const getInterazioniByCantiereId = unstable_cache(
  async (cantiereId: number) => {
    const interazioni = await prisma.interazioni.findMany({
      where: {
        cantieri_id: cantiereId,
      },
      relationLoadStrategy: "join",
      select: {
        id: true,
        ore: true,
        minuti: true,
        tempo_totale: true,
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
        mezzi: {
          select: {
            id: true,
            nome: true,
          },
        },
        attivita: {
          select: {
            id: true,
            date: true,
          },
        },
        user_interazione_created_byTouser: {
          select: {
            id: true,
            name: true,
          },
        },
        user_interazione_last_update_byTouser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Convert BigInt to string for JSON serialization
    return interazioni.map((interazione) => ({
      ...interazione,
      tempo_totale: interazione.tempo_totale.toString(),
    }));
  },
  ["interazioni-by-cantiere"],
  { tags: ["interazioni", "cantieri"], revalidate: 60 },
);

export const getInterazioni = unstable_cache(
  async () => {
    const interazioni = await prisma.interazioni.findMany({
      relationLoadStrategy: "join",
      select: {
        id: true,
        ore: true,
        minuti: true,
        tempo_totale: true,
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
        mezzi: {
          select: {
            id: true,
            nome: true,
          },
        },
        attivita: {
          select: {
            id: true,
            date: true,
          },
        },
        user_interazione_created_byTouser: {
          select: {
            id: true,
            name: true,
          },
        },
        user_interazione_last_update_byTouser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Convert BigInt to string for JSON serialization
    return interazioni.map((interazione) => ({
      ...interazione,
      tempo_totale: interazione.tempo_totale.toString(),
    }));
  },
  ["interazioni"],
  { tags: ["interazioni", "all"], revalidate: 60 },
);

export const getAttivita = unstable_cache(
  async () => {
    const attivita = await prisma.attivita.findMany({
      relationLoadStrategy: "join",
      select: {
        id: true,
        date: true,
        external_id: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return attivita;
  },
  ["attivita"],
  { tags: ["attivita", "all"], revalidate: 60 },
);

export type Interazione = NonNullable<
  Awaited<ReturnType<typeof getInterazioniByCantiereId>>
>[number];
export type InterazioneAll = NonNullable<
  Awaited<ReturnType<typeof getInterazioni>>
>[number];
export type Attivita = NonNullable<
  Awaited<ReturnType<typeof getAttivita>>
>[number];
