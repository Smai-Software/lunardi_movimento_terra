import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AggiungiCantiereModal from "@/components/aggiungi-cantiere-modal";
import CantieriTable from "@/components/cantieri-table";
import { auth } from "@/lib/auth";
import { getCantieri } from "@/lib/data/cantieri.data";

export default async function CantieriPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const cantieriData = await getCantieri();

  return (
    <div className="mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cantieri</h1>
        <AggiungiCantiereModal />
      </div>
      <CantieriTable cantieri={cantieriData} />
    </div>
  );
}
