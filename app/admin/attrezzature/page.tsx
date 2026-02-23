import { notFound, redirect } from "next/navigation";
import AggiungiAttrezzaturaModal from "@/components/aggiungi-attrezzatura-modal";
import AttrezzatureTable from "@/components/attrezzature-table";
import { getSession } from "@/lib/auth";

export default async function AttrezzaturePage() {
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
        <h1 className="text-3xl font-bold">Attrezzature</h1>
        <AggiungiAttrezzaturaModal />
      </div>
      <AttrezzatureTable />
    </div>
  );
}
