import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/cantieri/[id]/users - Lista utenti assegnati al cantiere
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
    const cantiereId = parseInt(id, 10);

    if (Number.isNaN(cantiereId)) {
      return NextResponse.json(
        { error: "ID cantiere non valido" },
        { status: 400 },
      );
    }

    const cantiere = await prisma.cantieri.findUnique({
      where: { id: cantiereId },
    });

    if (!cantiere) {
      return NextResponse.json(
        { error: "Cantiere non trovato" },
        { status: 404 },
      );
    }

    const userCantieri = await prisma.user_cantieri.findMany({
      where: { cantieri_id: cantiereId },
      select: {
        id: true,
        user_id: true,
        cantieri_id: true,
        created_at: true,
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ users: userCantieri });
  } catch (error) {
    console.error("Errore nel recupero utenti cantiere:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// POST /api/cantieri/[id]/users - Assegna utente al cantiere
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
    const cantiereId = parseInt(id, 10);

    if (Number.isNaN(cantiereId)) {
      return NextResponse.json(
        { error: "ID cantiere non valido" },
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

    const cantiere = await prisma.cantieri.findUnique({
      where: { id: cantiereId },
    });

    if (!cantiere) {
      return NextResponse.json(
        { error: "Cantiere non trovato" },
        { status: 404 },
      );
    }

    const existingAssignment = await prisma.user_cantieri.findFirst({
      where: {
        cantieri_id: cantiereId,
        user_id: userId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "L'utente è già assegnato a questo cantiere" },
        { status: 409 },
      );
    }

    await prisma.user_cantieri.create({
      data: {
        user_id: userId,
        cantieri_id: cantiereId,
        external_id: randomUUID(),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Errore nell'assegnazione utente al cantiere:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/cantieri/[id]/users?userId=xxx - Rimuovi utente dal cantiere
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
    const cantiereId = parseInt(id, 10);

    if (Number.isNaN(cantiereId)) {
      return NextResponse.json(
        { error: "ID cantiere non valido" },
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

    const deleteResult = await prisma.user_cantieri.deleteMany({
      where: {
        cantieri_id: cantiereId,
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
    console.error("Errore nella rimozione utente dal cantiere:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
