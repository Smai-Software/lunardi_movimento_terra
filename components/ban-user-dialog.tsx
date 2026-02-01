"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type BanUserDialogProps = {
  user: {
    id: string;
    name?: string | null;
    banned?: boolean | null | undefined;
  };
  onSuccess?: () => void;
};

export default function BanUserDialog({
  user,
  onSuccess,
}: BanUserDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const isBanned = Boolean(user.banned);

  const openModal = () => {
    setReason("");
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setReason("");
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (isBanned) {
        const res = await fetch(`/api/users/${user.id}/ban`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((data as { error?: string }).error || "Errore nello sblocco");
        }
        toast.success("Utente sbloccato con successo");
      } else {
        const res = await fetch(`/api/users/${user.id}/ban`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((data as { error?: string }).error || "Errore nel blocco");
        }
        toast.success("Utente bloccato con successo");
      }
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/users"));
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={openModal}
      >
        {isBanned ? "Sblocca" : "Blocca"}
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Conferma</h3>
          <form onSubmit={handleSubmit}>
            <p className="mb-3 text-base">
              {isBanned
                ? `Vuoi sbloccare ${user.name ?? "questo utente"}?`
                : `Vuoi bloccare ${user.name ?? "questo utente"}?`}
            </p>
            {!isBanned && (
              <div className="mb-3">
                <label
                  className="block font-medium mb-1 text-sm"
                  htmlFor={`ban-reason-${user.id}`}
                >
                  Motivo (opzionale)
                </label>
                <textarea
                  id={`ban-reason-${user.id}`}
                  className="textarea textarea-bordered w-full"
                  placeholder="Inserisci un motivo (opzionale)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}
            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annulla
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : isBanned ? (
                  "Conferma sblocco"
                ) : (
                  "Conferma blocco"
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button tabIndex={-1} type="submit">
            Annulla
          </button>
        </form>
      </dialog>
    </>
  );
}
