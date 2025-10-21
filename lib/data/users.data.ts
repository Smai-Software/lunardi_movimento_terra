"use server";

import prisma from "@/lib/prisma";

export const getUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      banned: true,
      licenseCamion: true,
      licenseEscavatore: true,
      phone: true,
    },
    orderBy: {
      name: "asc",
    },
    where: {
      role: {
        not: "admin",
      },
    },
  });

  return users;
};

export const getUsersNotBanned = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      banned: true,
      licenseCamion: true,
      licenseEscavatore: true,
      phone: true,
    },
    orderBy: {
      name: "asc",
    },
    where: {
      role: {
        not: "admin",
      },
      banned: false,
    },
  });

  return users;
};

export type UserNotBanned = NonNullable<
  Awaited<ReturnType<typeof getUsersNotBanned>>
>[number];
