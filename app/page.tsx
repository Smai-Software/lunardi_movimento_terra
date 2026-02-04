import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutForm from "@/components/logout-form";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }
  if (session.user.role === "admin") {
    redirect("/admin");
  }
  if (session.user.role === "user") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto min-h-screen flex items-center justify-center">
      <LogoutForm />
    </div>
  );
}
