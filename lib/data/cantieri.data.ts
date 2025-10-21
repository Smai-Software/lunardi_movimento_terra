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
