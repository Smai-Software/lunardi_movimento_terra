import prisma from "@/lib/prisma";

export async function getTotalHoursByCantiereId(cantieriId: number) {
  const [interazioniSum, trasportiSum] = await Promise.all([
    prisma.interazioni.aggregate({
      where: { cantieri_id: cantieriId },
      _sum: { tempo_totale: true },
    }),
    prisma.trasporti.aggregate({
      where: {
        OR: [
          { cantieri_partenza_id: cantieriId },
          { cantieri_arrivo_id: cantieriId },
        ],
      },
      _sum: { tempo_totale: true },
    }),
  ]);
  const interazioniMs = Number(interazioniSum._sum.tempo_totale ?? 0);
  const trasportiMs = Number(trasportiSum._sum.tempo_totale ?? 0);
  return String(interazioniMs + trasportiMs);
}

export async function getTotalInterazioniByCantiereId(cantieriId: number) {
  const result = await prisma.interazioni.count({
    where: { cantieri_id: cantieriId },
  });
  return result;
}

export async function getTotalHoursByAttivitaId(attivitaId: number) {
  const [interazioniSum, assenzeSum, trasportiSum] = await Promise.all([
    prisma.interazioni.aggregate({
      where: { attivita_id: attivitaId },
      _sum: { tempo_totale: true },
    }),
    prisma.assenze.aggregate({
      where: { attivita_id: attivitaId },
      _sum: { tempo_totale: true },
    }),
    prisma.trasporti.aggregate({
      where: { attivita_id: attivitaId },
      _sum: { tempo_totale: true },
    }),
  ]);
  const interazioniMs = Number(interazioniSum._sum.tempo_totale ?? 0);
  const assenzeMs = Number(assenzeSum._sum.tempo_totale ?? 0);
  const trasportiMs = Number(trasportiSum._sum.tempo_totale ?? 0);
  return String(interazioniMs + assenzeMs + trasportiMs);
}

export async function getTotalInterazioniByAttivitaId(attivitaId: number) {
  const result = await prisma.interazioni.count({
    where: { attivita_id: attivitaId },
  });
  return result;
}
