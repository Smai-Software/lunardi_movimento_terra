"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { SubmitButton } from "@/components/submit-button";

export default function FormLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data, error: signInError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/admin",
      });
      if (signInError) {
        setError(signInError.message ?? "Email o password non validi");
        return;
      }
      if (data) {
        toast.success("Login effettuato con successo");
        router.push(data.url ?? "/admin");
        router.refresh();
      }
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        className="flex flex-col mt-4 gap-2"
        onSubmit={handleSubmit}
      >
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <SubmitButton
          className="btn btn-primary my-2"
          isPending={isSubmitting}
        >
          Accedi
        </SubmitButton>
      </form>
    </>
  );
}
