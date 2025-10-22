"use server";

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export const getCantieri = unstable_cache(
  async () => {
    const cantieri = await prisma.cantieri.findMany({
      relationLoadStrategy: "join",
      select: {
        id: true,
        nome: true,
        descrizione: true,
        open: true,
        closed_at: true,
        created_at: true,
        last_update_at: true,
        created_by: true,
        last_update_by: true,
        external_id: true,
        user_cantieri_created_byTouser: {
          select: {
            id: true,
            name: true,
          },
        },
        user_cantieri_last_update_byTouser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return cantieri;
  },
  ["cantieri"],
  { tags: ["cantieri", "all"], revalidate: 60 },
);

export const getCantieriByUserId = async (userId: string) => {
  const cantieri = await prisma.cantieri.findMany({
    relationLoadStrategy: "join",
    select: {
      id: true,
      nome: true,
      descrizione: true,
      open: true,
      closed_at: true,
      created_at: true,
      last_update_at: true,
      created_by: true,
      last_update_by: true,
      external_id: true,
      user_cantieri_created_byTouser: {
        select: {
          id: true,
          name: true,
        },
      },
      user_cantieri_last_update_byTouser: {
        select: {
          id: true,
          name: true,
        },
      },
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

export const getUserCantieriByCantiereId = async (cantiereId: number) => {
  const userCantieri = await prisma.user_cantieri.findMany({
    relationLoadStrategy: "join",
    where: {
      cantieri_id: cantiereId,
    },
    select: {
      id: true,
      user_id: true,
      cantieri_id: true,
      created_at: true,
      user: {
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

  return userCantieri;
};

export type Cantiere = NonNullable<
  Awaited<ReturnType<typeof getCantieri>>
>[number];
export type CantiereByUser = NonNullable<
  Awaited<ReturnType<typeof getCantieriByUserId>>
>[number];
export type UserCantieri = NonNullable<
  Awaited<ReturnType<typeof getUserCantieriByCantiereId>>
>[number];
