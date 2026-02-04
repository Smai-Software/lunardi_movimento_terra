"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

type EliminaInterazioneModalProps = {
  interazione: {
    id: number;
    ore: number;
    minuti: number;
    user: {
      id: string;
      name: string;
    };
    mezzi: {
      id: number;
      nome: string;
    } | null;
    attivita: {
      id: number;
      date: string;
    };
  };
  onSuccess?: () => void;
};

export default function EliminaInterazioneModal({
  interazione,
  onSuccess,
}: EliminaInterazioneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/interazioni/${interazione.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore durante l'eliminazione");
      }
      toast.success("Interazione eliminata con successo!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'eliminazione dell'interazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (ore: number, minuti: number) => {
    return `${ore}h ${minuti}m`;
  };

  return (
    <>
      <button type="button" className="btn btn-sm btn-outline btn-error" onClick={openModal}>
        Elimina
      </button>
      <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Conferma eliminazione</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <p className="mb-2">
              Sei sicuro di voler eliminare questa interazione?
            </p>
            <div className="bg-base-200 p-3 rounded-lg">
              <p>
                <strong>Utente:</strong> {interazione.user.name}
              </p>
              <p>
                <strong>Mezzo:</strong> {interazione.mezzi?.nome ?? "Nessuno"}
              </p>
              <p>
                <strong>Attività:</strong>{" "}
                {new Date(interazione.attivita.date).toLocaleDateString(
                  "it-IT",
                )}
              </p>
              <p>
                <strong>Tempo:</strong>{" "}
                {formatTime(interazione.ore, interazione.minuti)}
              </p>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-error">{error}</p>
          )}
          <div className="modal-action">
            <button type="button" className="btn" onClick={handleClose} disabled={isSubmitting}>
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-error"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-xs" />
              )}
              Conferma eliminazione
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
