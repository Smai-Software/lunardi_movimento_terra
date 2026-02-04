import { notFound, redirect } from "next/navigation";
import AggiungiMezzoModal from "@/components/aggiungi-mezzo-modal";
import MezziTable from "@/components/mezzi-table";
import { getSession } from "@/lib/auth";

export default async function MezziPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  return (
    <div className="mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mezzi</h1>
        <AggiungiMezzoModal />
      </div>
      <MezziTable />
    </div>
  );
}
