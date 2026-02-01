"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { SubmitButton } from "@/components/submit-button";

export default function FormResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Link non valido o scaduto.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (resetError) {
        setError(resetError.message ?? "Errore nell'impostazione della password");
        return;
      }
      setSuccess(true);
      toast.success("Password aggiornata. Effettua il login.");
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="alert alert-success my-2">
          Password aggiornata con successo.
        </div>
        <Link href="/sign-in" className="link link-primary">
          Effettua il login
        </Link>
      </div>
    );
  }

  return (
    <>
      <form className="flex flex-col mt-4 gap-2" onSubmit={handleSubmit}>
        <input type="hidden" name="token" value={token} />
        <div className="fieldset">
          <label className="label" htmlFor="password">
            Nuova password
          </label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input input-md w-full"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <SubmitButton
          className="btn btn-primary my-2"
          isPending={isSubmitting}
        >
          Imposta password
        </SubmitButton>
      </form>
    </>
  );
}
