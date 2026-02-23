import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// GET /api/attrezzature - Lista attrezzature con paginazione e ricerca su nome
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10),
      ),
    );
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "nome";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const where: { nome?: { contains: string } } = {};
    if (search) {
      where.nome = { contains: search };
    }

    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortOrder === "desc" ? "desc" : "asc",
    };

    const [attrezzatureList, total] = await Promise.all([
      prisma.attrezzature.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user_attrezzature_created_byTouser: {
            select: { id: true, name: true },
          },
          user_attrezzature_last_update_byTouser: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.attrezzature.count({ where }),
    ]);

    return NextResponse.json({
      attrezzature: attrezzatureList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore nel recupero attrezzature:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/attrezzature - Crea attrezzatura
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await request.json();
    const { nome } = body;

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

    const attrezzatura = await prisma.attrezzature.create({
      data: {
        nome: trimmedNome,
        created_at: new Date(),
        last_update_at: new Date(),
        created_by: userId,
        last_update_by: userId,
        external_id: randomUUID(),
      },
      include: {
        user_attrezzature_created_byTouser: {
          select: { id: true, name: true },
        },
        user_attrezzature_last_update_byTouser: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ attrezzatura }, { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione attrezzatura:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
