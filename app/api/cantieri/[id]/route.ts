import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { refresh } from "next/cache";

// GET /api/cantieri/[id]
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
      include: {
        user_cantieri_created_byTouser: {
          select: { id: true, name: true },
        },
        user_cantieri_last_update_byTouser: {
          select: { id: true, name: true },
        },
        _count: { select: { interazioni: true } },
        interazioni: { select: { tempo_totale: true } },
        trasporti_partenza: { select: { tempo_totale: true } },
        trasporti_arrivo: { select: { tempo_totale: true } },
      },
    });

    if (!cantiere) {
      return NextResponse.json(
        { error: "Cantiere non trovato" },
        { status: 404 },
      );
    }

    const interazioniMs = cantiere.interazioni.reduce(
      (sum, i) => sum + Number(i.tempo_totale),
      0,
    );
    const trasportiPartenzaMs = (cantiere.trasporti_partenza ?? []).reduce(
      (sum, t) => sum + Number(t.tempo_totale),
      0,
    );
    const trasportiArrivoMs = (cantiere.trasporti_arrivo ?? []).reduce(
      (sum, t) => sum + Number(t.tempo_totale),
      0,
    );
    const totalMilliseconds = interazioniMs + trasportiPartenzaMs + trasportiArrivoMs;

    return NextResponse.json({
      cantiere: {
        ...cantiere,
        totalInterazioni: cantiere._count.interazioni,
        totalMilliseconds,
        interazioni: cantiere.interazioni.map((i) => ({
          ...i,
          tempo_totale: i.tempo_totale.toString(),
        })),
        trasporti_partenza: (cantiere.trasporti_partenza ?? []).map((t) => ({
          ...t,
          tempo_totale: t.tempo_totale.toString(),
        })),
        trasporti_arrivo: (cantiere.trasporti_arrivo ?? []).map((t) => ({
          ...t,
          tempo_totale: t.tempo_totale.toString(),
        })),
      },
    });
  } catch (error) {
    console.error("Errore nel recupero cantiere:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/cantieri/[id]
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
    const cantiereId = parseInt(id, 10);

    if (Number.isNaN(cantiereId)) {
      return NextResponse.json(
        { error: "ID cantiere non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.cantieri.findUnique({
      where: { id: cantiereId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cantiere non trovato" },
        { status: 404 },
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

    const cantiere = await prisma.cantieri.update({
      where: { id: cantiereId },
      data: {
        nome: trimmedNome,
        descrizione: typeof descrizione === "string" ? descrizione.trim() : "",
        open: open === true || open === "true",
        last_update_at: new Date(),
        last_update_by: userId,
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
    
    return NextResponse.json({ cantiere });
  } catch (error) {
    console.error("Errore nell'aggiornamento cantiere:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/cantieri/[id]
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
    const cantiereId = parseInt(id, 10);

    if (Number.isNaN(cantiereId)) {
      return NextResponse.json(
        { error: "ID cantiere non valido" },
        { status: 400 },
      );
    }

    const existing = await prisma.cantieri.findUnique({
      where: { id: cantiereId },
      include: {
        interazioni: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cantiere non trovato" },
        { status: 404 },
      );
    }

    // Cantieri can be deleted even with interazioni (cascade in schema)
    await prisma.cantieri.delete({
      where: { id: cantiereId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nell'eliminazione cantiere:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
