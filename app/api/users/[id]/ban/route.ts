import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth, getErrorMessage } from "@/lib/auth";

// POST /api/users/[id]/ban - Banna utente
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
    const body = await request.json().catch(() => ({}));
    const reason = body.reason ?? "";

    await auth.api.banUser({
      body: {
        userId: id,
        banReason: typeof reason === "string" ? reason : "",
      },
      headers: await headers(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nel ban utente:", error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: getErrorMessage(error.status?.toString() ?? error.body?.code ?? "") },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id]/ban - Sbanna utente
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

    await auth.api.unbanUser({
      body: { userId: id },
      headers: await headers(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore nello unban utente:", error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: getErrorMessage(error.status?.toString() ?? error.body?.code ?? "") },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
