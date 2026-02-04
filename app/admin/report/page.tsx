import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ReportWrapper from "@/components/report-wrapper";

export default async function ReportPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  return (
    <div className="mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Report</h1>
      <ReportWrapper />
    </div>
  );
}
