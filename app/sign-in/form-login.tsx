"use client";

import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { loginUser } from "@/lib/actions/users.actions";
import { toast } from "sonner";

export default function FormLogin() {
  const [email, setEmail] = useState("");
  const { execute, result, input } = useAction(loginUser, {
    onExecute() {
      if (result?.data?.success === false && input instanceof FormData) {
        const emailEntry = input.get("email");
        if (typeof emailEntry === "string") {
          setEmail(emailEntry);
        }
      }
    },
    onNavigation() {
      toast.success("Login effettuato con successo");
    },
  });

  return (
    <>
      <form className="flex flex-col mt-4 gap-2" action={execute}>
        <div className="fieldset">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            placeholder="Email"
            name="email"
            className="input input-md w-full"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="fieldset">
          <label className="label flex justify-between" htmlFor="password">
            <span>Password</span>
            <Link href="/recovery-password" className="link">
              Password dimenticata?
            </Link>
          </label>
          <input
            type="password"
            placeholder="Password"
            name="password"
            className="input input-md w-full"
            required
          />
        </div>
        <SubmitButton className="btn btn-primary my-2">Accedi</SubmitButton>
      </form>
      <ValidationErrors result={result} />
    </>
  );
}
