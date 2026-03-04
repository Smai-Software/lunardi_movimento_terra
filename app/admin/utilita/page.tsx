import { notFound, redirect } from "next/navigation";
import AggiungiFerieForm from "@/components/utilita/aggiungi-ferie-form";
import { getSession } from "@/lib/auth";

export default async function UtilitaPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  return (
    <div className="mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Utilità</h1>
      <div className="card bg-base-100 shadow-xl border border-gray-200 max-w-2xl">
        <div className="card-body">
          <h2 className="text-xl font-semibold">Aggiungi ferie</h2>
          <AggiungiFerieForm />
        </div>
      </div>
    </div>
  );
}
