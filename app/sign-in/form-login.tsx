"use client";

import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { loginUser } from "@/lib/actions/users.actions";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useState } from "react";

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
            className="input input-md input-primary w-full"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="fieldset">
          <label className="label flex justify-between" htmlFor="password">
            <span>Password</span>
            <Link href="/recovery-password" className="link link-primary">
              Password dimenticata?
            </Link>
          </label>
          <input
            type="password"
            placeholder="Password"
            name="password"
            className="input input-md input-primary w-full"
            required
          />
        </div>
        <SubmitButton className="btn btn-primary my-2">Accedi</SubmitButton>
      </form>
      <ValidationErrors result={result} />
    </>
  );
}
