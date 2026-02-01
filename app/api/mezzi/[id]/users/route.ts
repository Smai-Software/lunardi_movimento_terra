import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/mezzi/[id]/users - Lista utenti assegnati al mezzo
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const mezzoId = parseInt(id, 10);

    if (Number.isNaN(mezzoId)) {
      return NextResponse.json(
        { error: "ID mezzo non valido" },
        { status: 400 },
      );
    }

    const mezzo = await prisma.mezzi.findUnique({
      where: { id: mezzoId },
    });

    if (!mezzo) {
      return NextResponse.json(
        { error: "Mezzo non trovato" },
        { status: 404 },
      );
    }

    const userMezzi = await prisma.user_mezzi.findMany({
      where: { mezzi_id: mezzoId },
      select: {
        id: true,
        user_id: true,
        mezzi_id: true,
        created_at: true,
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const userIds = userMezzi.map((um) => um.user_id);

    return NextResponse.json({ users: userMezzi, userIds });
  } catch (error) {
    console.error("Errore nel recupero utenti mezzo:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/mezzi/[id]/users - Assegna utente al mezzo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const mezzoId = parseInt(id, 10);

    if (Number.isNaN(mezzoId)) {
      return NextResponse.json(
        { error: "ID mezzo non valido" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "ID utente obbligatorio" },
        { status: 400 },
      );
    }

    const mezzo = await prisma.mezzi.findUnique({
      where: { id: mezzoId },
    });

    if (!mezzo) {
      return NextResponse.json(
        { error: "Mezzo non trovato" },
        { status: 404 },
      );
    }

    const existingAssignment = await prisma.user_mezzi.findFirst({
      where: {
        mezzi_id: mezzoId,
        user_id: userId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "L'utente è già assegnato a questo mezzo" },
        { status: 409 },
      );
    }

    await prisma.user_mezzi.create({
      data: {
        user_id: userId,
        mezzi_id: mezzoId,
        external_id: randomUUID(),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Errore nell'assegnazione utente al mezzo:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/mezzi/[id]/users - Assegna lista utenti (sostituisce assegnazioni)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const mezzoId = parseInt(id, 10);

    if (Number.isNaN(mezzoId)) {
      return NextResponse.json(
        { error: "ID mezzo non valido" },
        { status: 400 },
      );
    }

    const mezzo = await prisma.mezzi.findUnique({
      where: { id: mezzoId },
    });

    if (!mezzo) {
      return NextResponse.json(
        { error: "Mezzo non trovato" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { userIds } = body;

    const newUserIds = Array.isArray(userIds)
      ? userIds.filter((id: unknown) => typeof id === "string")
      : [];

    const currentAssignments = await prisma.user_mezzi.findMany({
      where: { mezzi_id: mezzoId },
      select: { user_id: true },
    });
    const currentUserIds = currentAssignments.map((a) => a.user_id);

    const usersToAdd = newUserIds.filter((id: string) => !currentUserIds.includes(id));
    const usersToRemove = currentUserIds.filter((id) => !newUserIds.includes(id));

    if (usersToAdd.length > 0) {
      await prisma.user_mezzi.createMany({
        data: usersToAdd.map((user_id: string) => ({
          user_id,
          mezzi_id: mezzoId,
          external_id: randomUUID(),
        })),
      });
    }

    if (usersToRemove.length > 0) {
      await prisma.user_mezzi.deleteMany({
        where: {
          mezzi_id: mezzoId,
          user_id: { in: usersToRemove },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'assegnazione utenti al mezzo:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/mezzi/[id]/users?userId=xxx - Rimuovi utente dal mezzo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const mezzoId = parseInt(id, 10);

    if (Number.isNaN(mezzoId)) {
      return NextResponse.json(
        { error: "ID mezzo non valido" },
        { status: 400 },
      );
    }

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "ID utente obbligatorio" },
        { status: 400 },
      );
    }

    const deleteResult = await prisma.user_mezzi.deleteMany({
      where: {
        mezzi_id: mezzoId,
        user_id: userId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { error: "Utente non trovato per la rimozione" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nella rimozione utente dal mezzo:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
