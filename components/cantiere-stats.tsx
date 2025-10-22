import prisma from "@/lib/prisma";

export async function getTotalHoursByCantiereId(cantieriId: number) {
  const result = await prisma.interazioni.aggregate({
    where: { cantieri_id: cantieriId },
    _sum: { tempo_totale: true },
  });
  return result._sum.tempo_totale?.toString() || "0";
}

export async function getUniqueUsersByCantiereId(cantieriId: number) {
  const result = await prisma.interazioni.groupBy({
    by: ["user_id"],
    where: { cantieri_id: cantieriId },
    _count: { user_id: true },
  });
  return result.length;
}

export async function getUniqueMezziByCantiereId(cantieriId: number) {
  const result = await prisma.interazioni.groupBy({
    by: ["mezzi_id"],
    where: {
      cantieri_id: cantieriId,
      mezzi_id: { not: null },
    },
    _count: { mezzi_id: true },
  });
  return result.length;
}
