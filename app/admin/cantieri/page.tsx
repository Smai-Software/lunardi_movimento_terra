import { notFound, redirect } from "next/navigation";
import AggiungiCantiereModal from "@/components/aggiungi-cantiere-modal";
import CantieriTable from "@/components/cantieri-table";
import { getSession } from "@/lib/auth";

export default async function CantieriPage() {
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
        <h1 className="text-3xl font-bold">Cantieri</h1>
        <AggiungiCantiereModal />
      </div>
      <CantieriTable />
    </div>
  );
}
