import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FormResetPassword from "./form-reset";

export default async function ResetPassword() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user?.role === "admin") {
    redirect("/admin");
  }
  if (session?.user?.role === "user") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-base-200">
      <h1 className="text-2xl font-bold">Lunardi Movimento Terra</h1>
      <div className="flex flex-col gap-4 card bg-base-100 shadow-xl max-w-sm w-full sm:max-w-lg mt-4">
        <div className="card-body">
          <h3 className="font-semibold text-xl">Reimposta password</h3>
          <FormResetPassword />
        </div>
      </div>
    </div>
  );
}
