import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/attrezzature/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const attrezzaturaId = parseInt(id, 10);

    if (Number.isNaN(attrezzaturaId)) {
      return NextResponse.json(
        { error: "ID attrezzatura non valido" },
        { status: 400 },
      );
    }

    const attrezzatura = await prisma.attrezzature.findUnique({
      where: { id: attrezzaturaId },
      include: {
        user_attrezzature_created_byTouser: {
          select: { id: true, name: true },
        },
        user_attrezzature_last_update_byTouser: {
          select: { id: true, name: true },
        },
      },
    });

    if (!attrezzatura) {
      return NextResponse.json(
        { error: "Attrezzatura non trovata" },
        { status: 404 },
      );
    }

    return NextResponse.json({ attrezzatura });
  } catch (error) {
    console.error("Errore nel recupero attrezzatura:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/attrezzature/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const attrezzaturaId = parseInt(id, 10);

    if (Number.isNaN(attrezzaturaId)) {
      return NextResponse.json(
        { error: "ID attrezzatura non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.attrezzature.findUnique({
      where: { id: attrezzaturaId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attrezzatura non trovata" },
        { status: 404 },
      );
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

    const attrezzatura = await prisma.attrezzature.update({
      where: { id: attrezzaturaId },
      data: {
        nome: trimmedNome,
        last_update_at: new Date(),
        last_update_by: userId,
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

    return NextResponse.json({ attrezzatura });
  } catch (error) {
    console.error("Errore nell'aggiornamento attrezzatura:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/attrezzature/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await params;
    const attrezzaturaId = parseInt(id, 10);

    if (Number.isNaN(attrezzaturaId)) {
      return NextResponse.json(
        { error: "ID attrezzatura non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.attrezzature.findUnique({
      where: { id: attrezzaturaId },
      include: {
        interazioni: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attrezzatura non trovata" },
        { status: 404 },
      );
    }

    if (existing.interazioni.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossibile eliminare l'attrezzatura: ci sono interazioni collegate",
        },
        { status: 400 },
      );
    }

    await prisma.attrezzature.delete({
      where: { id: attrezzaturaId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'eliminazione attrezzatura:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
