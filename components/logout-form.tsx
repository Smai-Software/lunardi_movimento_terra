"use client";

import { logoutUser } from "@/lib/actions/users.actions";
import { SubmitButton } from "./submit-button";
import { useAction } from "next-safe-action/hooks";

export default function LogoutForm() {
  const { execute } = useAction(logoutUser);

  return (
    <form action={execute}>
      <SubmitButton className="btn btn-outline">Logout</SubmitButton>
    </form>
  );
}
