import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function serializeAttivita(attivita: {
  interazioni?: { tempo_totale: bigint }[];
  [key: string]: unknown;
}) {
  const { interazioni, ...rest } = attivita;
  const result = { ...rest } as Record<string, unknown>;
  if (Array.isArray(interazioni)) {
    result.interazioni = interazioni.map((i) => ({
      ...i,
      tempo_totale: typeof i.tempo_totale === "bigint" ? i.tempo_totale.toString() : i.tempo_totale,
    }));
  }
  return result;
}

// GET /api/attivita - Lista attivita con paginazione, filtro e ordinamento
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
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const userIdFilter = searchParams.get("userId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const where: {
      user?: { name?: { contains: string } };
      date?: { gte?: Date; lte?: Date };
      user_id?: string;
    } = {};

    if (search) {
      where.user = { name: { contains: search } };
    }
    if (userIdFilter) {
      where.user_id = userIdFilter;
    }
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!Number.isNaN(d.getTime())) {
        where.date = { ...(where.date as object), gte: d };
      }
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!Number.isNaN(d.getTime())) {
        where.date = { ...(where.date as object), lte: d };
      }
    }

    const sortOrderVal = (sortOrder === "desc" ? "desc" : "asc") as "asc" | "desc";
    const orderBy =
      sortBy === "user"
        ? ({ user: { name: sortOrderVal } } as const)
        : ({ [sortBy]: sortOrderVal } as { [key: string]: "asc" | "desc" });

    const [attivitaList, total] = await Promise.all([
      prisma.attivita.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true },
          },
          user_attivita_created_byTouser: {
            select: { id: true, name: true },
          },
          user_attivita_last_update_byTouser: {
            select: { id: true, name: true },
          },
          interazioni: {
            select: {
              cantieri_id: true,
              mezzi_id: true,
              tempo_totale: true,
            },
          },
        },
      }),
      prisma.attivita.count({ where }),
    ]);

    const attivitaWithCounts = attivitaList.map((a) => {
      const uniqueCantieri = new Set(a.interazioni.map((i) => i.cantieri_id));
      const uniqueMezzi = new Set(
        a.interazioni.filter((i) => i.mezzi_id).map((i) => i.mezzi_id),
      );
      const totalMilliseconds = a.interazioni.reduce(
        (sum, i) => sum + Number(i.tempo_totale),
        0,
      );
      return serializeAttivita({
        ...a,
        cantieriCount: uniqueCantieri.size,
        mezziCount: uniqueMezzi.size,
        totalMilliseconds,
      });
    });

    return NextResponse.json({
      attivita: attivitaWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Errore nel recupero attivita:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/attivita - Crea attivita (con o senza interazioni)
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
    const { date, user_id, interazioni } = body;

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "La data è obbligatoria" },
        { status: 400 },
      );
    }
    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        { error: "L'utente è obbligatorio" },
        { status: 400 },
      );
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Data non valida" },
        { status: 400 },
      );
    }

    const toLocalDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    if (session.user.role === "user") {
      const todayStr = toLocalDateString(new Date());
      if (toLocalDateString(parsedDate) > todayStr) {
        return NextResponse.json(
          { error: "La data non può essere futura" },
          { status: 400 },
        );
      }
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 7);
      const minDateStr = toLocalDateString(minDate);
      if (toLocalDateString(parsedDate) < minDateStr) {
        return NextResponse.json(
          { error: "La data non può essere più di 7 giorni indietro" },
          { status: 400 },
        );
      }
    }

    const userId = session.user.id;

    if (interazioni && Array.isArray(interazioni) && interazioni.length > 0) {
      const result = await prisma.$transaction(async (tx) => {
        const attivita = await tx.attivita.create({
          data: {
            date: parsedDate,
            user_id,
            created_at: new Date(),
            last_update_at: new Date(),
            created_by: userId,
            last_update_by: userId,
            external_id: randomUUID(),
          },
        });

        await tx.interazioni.createMany({
          data: interazioni.map(
            (inter: {
              cantieri_id: number;
              mezzi_id?: number | null;
              ore: number;
              minuti: number;
              note?: string;
            }) => {
              const ore = Number(inter.ore) || 0;
              const minuti = Math.min(
                59,
                Math.max(0, Number(inter.minuti) || 0),
              );
              return {
                ore,
                minuti,
                tempo_totale: BigInt((ore * 60 + minuti) * 60000),
                user_id,
                mezzi_id: inter.mezzi_id ?? null,
                cantieri_id: inter.cantieri_id,
                attivita_id: attivita.id,
                external_id: randomUUID(),
                created_at: new Date(),
                last_update_at: new Date(),
                created_by: userId,
                last_update_by: userId,
                note: inter.note || null,
              };
            },
          ),
        });

        return attivita;
      });

      const created = await prisma.attivita.findUnique({
        where: { id: result.id },
        include: {
          user: { select: { id: true, name: true } },
          interazioni: { select: { cantieri_id: true, mezzi_id: true, tempo_totale: true } },
        },
      });
      return NextResponse.json(
        { attivita: created ? serializeAttivita(created) : result },
        { status: 201 },
      );
    }

    const attivita = await prisma.attivita.create({
      data: {
        date: parsedDate,
        user_id,
        created_at: new Date(),
        last_update_at: new Date(),
        created_by: userId,
        last_update_by: userId,
        external_id: randomUUID(),
      },
      include: {
        user: { select: { id: true, name: true } },
        interazioni: { select: { cantieri_id: true, mezzi_id: true, tempo_totale: true } },
      },
    });

    return NextResponse.json(
      { attivita: serializeAttivita(attivita) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Errore nella creazione attivita:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
