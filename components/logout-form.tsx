"use client";

import { useAction } from "next-safe-action/hooks";
import { logoutUser } from "@/lib/actions/users.actions";
import { SubmitButton } from "./submit-button";

export default function LogoutForm() {
  const { execute } = useAction(logoutUser);

  return (
    <form action={execute}>
      <SubmitButton className="btn btn-outline">Logout</SubmitButton>
    </form>
  );
}
