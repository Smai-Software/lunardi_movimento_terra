import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard.data";
import { getUsersNotBanned } from "@/lib/data/users.data";
import DashboardWrapper from "@/components/dashboard-wrapper";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user has admin role
  if (session.user.role !== "admin") {
    notFound();
  }

  const dashboardData = await getDashboardData(30);
  const users = await getUsersNotBanned();

  return (
    <div className="mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <DashboardWrapper data={dashboardData} users={users} />
    </div>
  );
}
