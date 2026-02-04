import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardWrapper from "@/components/dashboard-wrapper";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  return (
    <div className="mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <DashboardWrapper />
    </div>
  );
}
