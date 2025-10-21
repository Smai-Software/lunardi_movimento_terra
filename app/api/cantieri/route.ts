import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Check authentication
    const startcount = performance.now();
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });
    const endcount = performance.now();
    console.log("Authentication checked", endcount - startcount);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Non autorizzato. Effettuare il login." },
        { status: 401 },
      );
    }

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

    return NextResponse.json(cantieri);
  } catch (error) {
    console.error("Errore nel recupero dei cantieri:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
