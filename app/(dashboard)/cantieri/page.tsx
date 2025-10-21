import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { startTransition } from "react";
import AggiungiCantiereModal from "@/components/aggiungi-cantiere-modal";
import CantieriTable from "@/components/cantieri-table";
import { auth } from "@/lib/auth";

export default async function CantieriPage() {
  const startcount = performance.now();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }
  const middlecount = performance.now();

  const cantieriData = await fetch(
    process.env.BETTER_AUTH_URL + "/api/cantieri",
    { headers: await headers() },
  ).then((res) => res.json());
  const endcount = performance.now();
  console.log("startcount", startcount);
  console.log("middlecount", middlecount);
  console.log("endcount", endcount);
  console.log("time", endcount - startcount);
  console.log("time", endcount - middlecount);
  console.log("time", middlecount - startcount);

  console.log(cantieriData);

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
