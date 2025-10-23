"use server";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const getAttivita = unstable_cache(
  async () => {
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

      return {
        ...attivita,
        cantieriCount: uniqueCantieri.size,
        mezziCount: uniqueMezzi.size,
      };
    });

    return attivitaWithCounts;
  },
  ["attivita"],
  { tags: ["attivita", "all"], revalidate: 60 },
);

export const getAttivitaByExternalId = unstable_cache(
  async (externalId: string) => {
    const attivita = await prisma.attivita.findUnique({
      where: {
        external_id: externalId,
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
      },
    });

    return attivita;
  },
  ["attivita-by-external-id"],
  { tags: ["attivita"], revalidate: 60 },
);

export const getInterazioniByAttivitaId = unstable_cache(
  async (attivitaId: number) => {
    const interazioni = await prisma.interazioni.findMany({
      where: {
        attivita_id: attivitaId,
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
        cantieri: {
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
  ["interazioni-by-attivita"],
  { tags: ["interazioni", "attivita"], revalidate: 60 },
);

export type Attivita = NonNullable<
  Awaited<ReturnType<typeof getAttivita>>
>[number];

export type AttivitaDetail = NonNullable<
  Awaited<ReturnType<typeof getAttivitaByExternalId>>
>;
