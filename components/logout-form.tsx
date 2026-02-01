"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SubmitButton } from "./submit-button";

export default function LogoutForm() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <SubmitButton className="btn btn-outline">Logout</SubmitButton>
    </form>
  );
}
