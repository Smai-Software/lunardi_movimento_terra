import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth, getErrorMessage } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/users/[id]
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        banned: true,
        banReason: true,
        licenseCamion: true,
        licenseEscavatore: true,
        phone: true,
        role: true,
      },
    });

    if (!user || user.role === "admin") {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 },
      );
    }

    const { role: _role, ...userWithoutRole } = user;

    return NextResponse.json({ user: userWithoutRole });
  } catch (error) {
    console.error("Errore nel recupero utente:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// PUT /api/users/[id] - Aggiorna utente (name, phone, licenses)
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

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 },
      );
    }

    if (existing.role === "admin") {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, phone, licenseCamion, licenseEscavatore } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Il nome è obbligatorio" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: typeof phone === "string" ? phone : "",
        licenseCamion: licenseCamion === true || licenseCamion === "true",
        licenseEscavatore: licenseEscavatore === true || licenseEscavatore === "true",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        licenseCamion: true,
        licenseEscavatore: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Errore nell'aggiornamento utente:", error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: getErrorMessage(error.status.toString()) },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
