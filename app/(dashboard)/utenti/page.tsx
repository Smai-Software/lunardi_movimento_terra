import { getUsers } from "@/lib/data/users.data";
import UtentiTable, { type Utente } from "@/components/utenti-table";
import AggiungiUtenteModal from "@/components/aggiungi-utente-modal";
import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function UtentiPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }
  const users = await getUsers();
  // Mappa utenti per garantire createdAt: string e banned: boolean sempre presente
  const utenti: Utente[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt:
      typeof u.createdAt === "string" ? u.createdAt : u.createdAt.toISOString(),
    banned: Boolean(u.banned ?? false),
    licenseCamion: u.licenseCamion,
    licenseEscavatore: u.licenseEscavatore,
    phone: u.phone,
  }));

  return (
    <div className="mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Utenti</h1>
        <AggiungiUtenteModal />
      </div>
      <UtentiTable utenti={utenti} />
    </div>
  );
}
