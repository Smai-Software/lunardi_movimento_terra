import prisma from "@/lib/prisma";

export async function getTotalHoursByCantiereId(cantieriId: number) {
  const result = await prisma.interazioni.aggregate({
    where: { cantieri_id: cantieriId },
    _sum: { tempo_totale: true },
  });
  return result._sum.tempo_totale?.toString() || "0";
}

export async function getTotalInterazioniByCantiereId(cantieriId: number) {
  const result = await prisma.interazioni.count({
    where: { cantieri_id: cantieriId },
  });
  return result;
}

export async function getTotalHoursByAttivitaId(attivitaId: number) {
  const result = await prisma.interazioni.aggregate({
    where: { attivita_id: attivitaId },
    _sum: { tempo_totale: true },
  });
  return result._sum.tempo_totale?.toString() || "0";
}

export async function getTotalInterazioniByAttivitaId(attivitaId: number) {
  const result = await prisma.interazioni.count({
    where: { attivita_id: attivitaId },
  });
  return result;
}
