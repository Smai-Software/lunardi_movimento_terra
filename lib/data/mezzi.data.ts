"use server";

import prisma from "@/lib/prisma";

export const getMezzi = async () => {
  const mezzi = await prisma.mezzi.findMany({
    relationLoadStrategy: "join",
    include: {
      user_mezzi_created_byTouser: true,
      user_mezzi_last_update_byTouser: true,
      user_mezzi: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return mezzi;
};

export const getMezziByUserId = async (userId: string) => {
  const mezzi = await prisma.mezzi.findMany({
    relationLoadStrategy: "join",
    select: {
      id: true,
      nome: true,
      descrizione: true,
      has_license_camion: true,
      has_license_escavatore: true,
      external_id: true,
      created_at: true,
      last_update_at: true,
      created_by: true,
      last_update_by: true,
      user_mezzi_created_byTouser: {
        select: {
          id: true,
          name: true,
        },
      },
      user_mezzi_last_update_byTouser: {
        select: {
          id: true,
          name: true,
        },
      },
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

export type Mezzo = NonNullable<Awaited<ReturnType<typeof getMezzi>>>[number];
export type MezzoByUser = NonNullable<
  Awaited<ReturnType<typeof getMezziByUserId>>
>[number];
