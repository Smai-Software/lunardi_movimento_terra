import { getMezzi } from "@/lib/data/mezzi.data";
import { getUsersNotBanned, UserNotBanned } from "@/lib/data/users.data";
import MezziTable from "@/components/mezzi-table";
import AggiungiMezzoModal from "@/components/aggiungi-mezzo-modal";
import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MezziPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const [mezziData, usersData] = await Promise.all([
    getMezzi(),
    getUsersNotBanned(),
  ]);
  
  return (
    <div className="mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mezzi</h1>
        <AggiungiMezzoModal />
      </div>
      <MezziTable mezzi={mezziData} users={usersData} />
    </div>
  );
}
