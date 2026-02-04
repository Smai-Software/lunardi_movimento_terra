import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UserAttivitaForm from "@/components/user-attivita-form";
import UserAttivitaTable from "@/components/user-attivita-table";
import { TabsClient } from "@/components/tabs-client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [session, params] = await Promise.all([
    getSession(),
    searchParams,
  ]);

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "user") {
    redirect("/admin");
  }

  const tab = params.tab ?? "insert";
  const userId = session.user.id;

  return (
    <div className="mx-auto px-2 md:px-6 py-8">
      <div className="mx-auto w-fit">
        <TabsClient tab={tab} />
      </div>

      <div className="mt-6">
        {tab === "insert" ? (
          <div className="container mx-auto">
            <UserAttivitaForm userId={userId} />
          </div>
        ) : (
          <UserAttivitaTable userId={userId} />
        )}
      </div>
    </div>
  );
}
