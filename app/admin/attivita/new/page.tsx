import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AttivitaForm from "@/components/attivita-form";
import { auth } from "@/lib/auth";

export default async function NewAttivitaPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <AttivitaForm />
    </div>
  );
}
