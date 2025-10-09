"use server";

import prisma from "@/lib/prisma";

export const getMezzi = async () => {
  const mezzi = await prisma.mezzi.findMany({
    relationLoadStrategy: "join",
    include: {
      user_mezzi_created_byTouser: true,
      user_mezzi_last_update_byTouser: true,
      user_mezzi: true
    },
    orderBy: {
      nome: "asc",
    },
  });

  return mezzi;
};

export type Mezzo = NonNullable<Awaited<ReturnType<typeof getMezzi>>>[number];
