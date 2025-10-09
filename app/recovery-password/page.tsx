import FormRecoveryPassword from "./form-recovery";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RecoveryPassword() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-base-200">
      <h1 className="text-2xl font-bold">Lunardi Movimento Terra</h1>
      <div className="flex flex-col gap-4 card bg-base-100 shadow-xl max-w-sm w-full sm:max-w-lg mt-4">
        <div className="card-body">
          <h3 className="font-semibold text-xl">Recupero password</h3>
          <FormRecoveryPassword />
        </div>
      </div>
    </div>
  );
}
