import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LogoutForm from "@/components/logout-form";
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
