"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type EliminaAttivitaModalProps = {
  attivita: {
    id: number;
    date: string;
    user: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
};

export default function EliminaAttivitaModal({
  attivita,
  onClose,
  onSuccess,
}: EliminaAttivitaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    setError(null);
    dialogRef.current?.close();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/attivita/${attivita.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'eliminazione");
      }
      toast.success("Attività eliminata con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/attivita"));
      onSuccess?.();
      router.push("/admin/attivita");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="modal" id="elimina-attivita-modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Elimina attività</h3>
        <p className="mb-4">
          Sei sicuro di voler eliminare l&apos;attività del{" "}
          <strong>{new Date(attivita.date).toLocaleDateString("it-IT")}</strong>{" "}
          per l&apos;utente <strong>{attivita.user}</strong>?
        </p>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-error"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Elimina attività"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" tabIndex={-1} onClick={handleClose}>
          Annulla
        </button>
      </form>
    </dialog>
  );
}
