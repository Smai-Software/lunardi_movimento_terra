import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// GET /api/mezzi - Lista mezzi con paginazione, filtro e ordinamento
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
    const userIdFilter = searchParams.get("userId") || "";
    const hasLicenseCamionFilter = searchParams.get("has_license_camion");
    const hasLicenseEscavatoreFilter = searchParams.get("has_license_escavatore");

    const where: {
      OR?: Array<
        | { nome: { contains: string } }
        | { descrizione: { contains: string } }
      >;
      user_mezzi?: { some: { user_id: string } };
      has_license_camion?: boolean;
      has_license_escavatore?: boolean;
    } = {};

    if (search) {
      where.OR = [
        { nome: { contains: search } },
        { descrizione: { contains: search } },
      ];
    }
    if (userIdFilter) {
      where.user_mezzi = { some: { user_id: userIdFilter } };
    }
    if (hasLicenseCamionFilter === "true") {
      where.has_license_camion = true;
    }
    if (hasLicenseEscavatoreFilter === "true") {
      where.has_license_escavatore = true;
    }

    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortOrder === "desc" ? "desc" : "asc",
    };

    const [mezziList, total] = await Promise.all([
      prisma.mezzi.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user_mezzi_created_byTouser: {
            select: { id: true, name: true },
          },
          user_mezzi_last_update_byTouser: {
            select: { id: true, name: true },
          },
          user_mezzi: {
            select: { user_id: true, user: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.mezzi.count({ where }),
    ]);

    return NextResponse.json({
      mezzi: mezziList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore nel recupero mezzi:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/mezzi - Crea mezzo
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
    const { nome, descrizione, has_license_camion, has_license_escavatore } =
      body;

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

    const mezzo = await prisma.mezzi.create({
      data: {
        nome: trimmedNome,
        descrizione: typeof descrizione === "string" ? descrizione.trim() : "",
        has_license_camion: has_license_camion === true || has_license_camion === "true",
        has_license_escavatore:
          has_license_escavatore === true || has_license_escavatore === "true",
        created_at: new Date(),
        last_update_at: new Date(),
        created_by: userId,
        last_update_by: userId,
        external_id: randomUUID(),
      },
      include: {
        user_mezzi_created_byTouser: {
          select: { id: true, name: true },
        },
        user_mezzi_last_update_byTouser: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ mezzo }, { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione mezzo:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
