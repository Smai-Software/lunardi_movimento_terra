import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AttivitaForm from "@/components/attivita-form";
import { auth } from "@/lib/auth";
import { getUsersNotBanned } from "@/lib/data/users.data";

export default async function NewAttivitaPage() {
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

  const users = await getUsersNotBanned();

  return (
    <div className="container mx-auto p-6">
      <AttivitaForm users={users} />
    </div>
  );
}
