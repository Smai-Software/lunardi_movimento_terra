import { notFound, redirect } from "next/navigation";
import AggiungiUtenteModal from "@/components/aggiungi-utente-modal";
import UtentiTable from "@/components/utenti-table";
import { getSession } from "@/lib/auth";

export default async function UtentiPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  const currentUserId = session.user.id as string;

  return (
    <div className="mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Utenti</h1>
        <AggiungiUtenteModal />
      </div>
      <UtentiTable currentUserId={currentUserId} />
    </div>
  );
}
