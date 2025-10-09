"use client";

import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { resetPassword } from "@/lib/actions/users.actions";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";

export default function FormRecoveryPassword() {
  const { execute, result } = useAction(resetPassword);
  return (
    <>
      {result.data?.success ? (
        <div className="flex flex-col items-center justify-center">
          <div className="alert alert-success my-2">{result.data?.message}</div>
          <Link href="/sign-in" className="link link-primary">
            Torna al login
          </Link>
        </div>
      ) : (
        <>
          <form className="flex flex-col mt-4 gap-2" action={execute}>
            <div className="fieldset">
              <label className="label flex justify-between" htmlFor="email">
                <span>Email</span>
                <Link href="/sign-in" className="link link-primary">
                  Torna al login
                </Link>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="input input-md input-primary w-full"
                required
                autoFocus
              />
            </div>
            <SubmitButton className="btn btn-primary my-2">
              Invia email di recupero
            </SubmitButton>
          </form>
          <ValidationErrors result={result} />
        </>
      )}
    </>
  );
}
