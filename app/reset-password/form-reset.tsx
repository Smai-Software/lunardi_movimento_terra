"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { resetPasswordWithToken } from "@/lib/actions/users.actions";

export default function FormResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { execute, result } = useAction(resetPasswordWithToken);
  return (
    <>
      {result.data?.success ? (
        <div className="flex flex-col items-center justify-center">
          <div className="alert alert-success my-2">{result.data?.message}</div>
          <Link href="/sign-in" className="link link-primary">
            Effettua il login
          </Link>
        </div>
      ) : (
        <>
          <form className="flex flex-col mt-4 gap-2" action={execute}>
            <input type="hidden" name="token" value={token} />
            <div className="fieldset">
              <label className="label" htmlFor="password">
                Nuova password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="input input-md input-primary w-full"
                required
              />
            </div>
            <SubmitButton className="btn btn-primary my-2">
              Imposta password
            </SubmitButton>
          </form>
          <ValidationErrors result={result} />
        </>
      )}
    </>
  );
}
