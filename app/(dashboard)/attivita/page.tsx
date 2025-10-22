import { PlusIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import AttivitaTable from "@/components/attivita-table";
import { auth } from "@/lib/auth";
import { getAttivita } from "@/lib/data/attivita.data";
import { getUsersNotBanned } from "@/lib/data/users.data";

export default async function AttivitaPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const [attivitaData, usersData] = await Promise.all([
    getAttivita(),
    getUsersNotBanned(),
  ]);

  return (
    <div className="mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Attività</h1>
        <Link href="/attivita/new" className="btn btn-primary">
          <PlusIcon className="size-4" /> Nuova Attività
        </Link>
      </div>
      <AttivitaTable attivita={attivitaData} users={usersData} />
    </div>
  );
}
