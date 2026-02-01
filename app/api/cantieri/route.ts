import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// GET /api/cantieri - Lista cantieri con paginazione, filtro e ordinamento
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)),
    );
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "nome";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const openFilter = searchParams.get("open"); // "true" | "false" | ""
    const userIdFilter = searchParams.get("userId") || "";

    const where: {
      OR?: Array<
        | { nome: { contains: string } }
        | { descrizione: { contains: string } }
      >;
      open?: boolean;
      user_cantieri?: { some: { user_id: string } };
    } = {};

    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { descrizione: { contains: search } },
      ];
    }
    if (openFilter === "true") where.open = true;
    if (openFilter === "false") where.open = false;
    if (userIdFilter) {
      where.user_cantieri = { some: { user_id: userIdFilter } };
      where.open = true; // only open when filtering by user
    }

    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortOrder === "desc" ? "desc" : "asc",
    };

    const [cantieriList, total] = await Promise.all([
      prisma.cantieri.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user_cantieri_created_byTouser: {
            select: { id: true, name: true },
          },
          user_cantieri_last_update_byTouser: {
            select: { id: true, name: true },
          },
          _count: { select: { interazioni: true } },
          interazioni: { select: { tempo_totale: true } },
        },
      }),
      prisma.cantieri.count({ where }),
    ]);

    const cantieriWithStats = cantieriList.map((c) => {
      const totalMilliseconds = c.interazioni.reduce(
        (sum, i) => sum + Number(i.tempo_totale),
        0,
      );
      return {
        ...c,
        totalInterazioni: c._count.interazioni,
        totalMilliseconds,
        interazioni: c.interazioni.map((i) => ({
          ...i,
          tempo_totale: i.tempo_totale.toString(),
        })),
      };
    });

    return NextResponse.json({
      cantieri: cantieriWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore nel recupero cantieri:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/cantieri - Crea cantiere
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { nome, descrizione, open } = body;

    if (!nome || typeof nome !== "string") {
      return NextResponse.json(
        { error: "Il nome è obbligatorio" },
        { status: 400 },
      );
    }

    const trimmedNome = nome.trim();
    if (trimmedNome.length < 1) {
      return NextResponse.json(
        { error: "Il nome è obbligatorio" },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;

    const cantiere = await prisma.cantieri.create({
      data: {
        nome: trimmedNome,
        descrizione: typeof descrizione === "string" ? descrizione.trim() : "",
        open: open === true || open === "true",
        created_at: new Date(),
        last_update_at: new Date(),
        created_by: userId,
        last_update_by: userId,
        external_id: randomUUID(),
      },
      include: {
        user_cantieri_created_byTouser: {
          select: { id: true, name: true },
        },
        user_cantieri_last_update_byTouser: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ cantiere }, { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione cantiere:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
