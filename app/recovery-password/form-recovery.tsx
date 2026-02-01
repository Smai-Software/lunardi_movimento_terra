"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { SubmitButton } from "@/components/submit-button";

export default function FormRecoveryPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: reqError } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
      });
      if (reqError) {
        setError(reqError.message ?? "Errore nell'invio dell'email");
        return;
      }
      setSent(true);
      toast.success(
        "Se l'email è registrata, riceverai un link per reimpostare la password.",
      );
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="alert alert-success my-2">
          Controlla la tua email per il link di recupero password.
        </div>
        <Link href="/sign-in" className="link link-primary">
          Torna al login
        </Link>
      </div>
    );
  }

  return (
    <>
      <form className="flex flex-col mt-4 gap-2" onSubmit={handleSubmit}>
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
            className="input input-md w-full"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <SubmitButton
          className="btn btn-primary my-2"
          isPending={isSubmitting}
        >
          Invia email di recupero
        </SubmitButton>
      </form>
    </>
  );
}
