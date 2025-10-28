import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserAttivitaLast7Days } from "@/lib/data/user-attivita.data";
import UserAttivitaForm from "@/components/user-attivita-form";
import UserAttivitaTable from "@/components/user-attivita-table";
import { TabsClient } from "@/components/tabs-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user has user role
  if (session.user.role !== "user") {
    redirect("/admin");
  }

  const params = await searchParams;
  const tab = params.tab || "insert";

  const userId = session.user.id;
  const attivita = await getUserAttivitaLast7Days(userId);

  return (
    <div className="mx-auto px-2 md:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="mx-auto w-fit">
        <TabsClient tab={tab} />
      </div>

      <div className="mt-6">
        {tab === "insert" ? (
          <div className="container mx-auto">
            <UserAttivitaForm userId={userId} />
          </div>
        ) : (
          <UserAttivitaTable attivita={attivita} />
        )}
      </div>
    </div>
  );
}
