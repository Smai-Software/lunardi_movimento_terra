import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/mezzi/[id]
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
      include: {
        user_mezzi_created_byTouser: {
          select: { id: true, name: true },
        },
        user_mezzi_last_update_byTouser: {
          select: { id: true, name: true },
        },
        user_mezzi: {
          select: {
            user_id: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!mezzo) {
      return NextResponse.json(
        { error: "Mezzo non trovato" },
        { status: 404 },
      );
    }

    return NextResponse.json({ mezzo });
  } catch (error) {
    console.error("Errore nel recupero mezzo:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/mezzi/[id]
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

    const existing = await prisma.mezzi.findUnique({
      where: { id: mezzoId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Mezzo non trovato" },
        { status: 404 },
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

    const mezzo = await prisma.mezzi.update({
      where: { id: mezzoId },
      data: {
        nome: trimmedNome,
        descrizione: typeof descrizione === "string" ? descrizione.trim() : "",
        has_license_camion: has_license_camion === true || has_license_camion === "true",
        has_license_escavatore:
          has_license_escavatore === true || has_license_escavatore === "true",
        last_update_at: new Date(),
        last_update_by: userId,
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

    return NextResponse.json({ mezzo });
  } catch (error) {
    console.error("Errore nell'aggiornamento mezzo:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/mezzi/[id]
export async function DELETE(
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

    const existing = await prisma.mezzi.findUnique({
      where: { id: mezzoId },
      include: {
        interazioni: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Mezzo non trovato" },
        { status: 404 },
      );
    }

    if (existing.interazioni.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossibile eliminare il mezzo: ci sono interazioni collegate",
        },
        { status: 400 },
      );
    }

    await prisma.mezzi.delete({
      where: { id: mezzoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'eliminazione mezzo:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
