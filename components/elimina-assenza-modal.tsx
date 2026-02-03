"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ASSENZA_TIPO_LABELS: Record<string, string> = {
  FERIE: "Ferie",
  PERMESSO: "Permesso",
  CASSA_INTEGRAZIONE: "Cassa integrazione",
  MUTUA: "Mutua",
  PATERNITA: "Paternità",
};

type EliminaAssenzaModalProps = {
  assenza: {
    id: number;
    tipo: string;
    ore: number;
    minuti: number;
    user: { id: string; name: string };
    attivita: { id: number; date: string };
  };
  onClose: () => void;
  onSuccess?: () => void;
};

export default function EliminaAssenzaModal({
  assenza,
  onClose,
  onSuccess,
}: EliminaAssenzaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/assenze/${assenza.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore durante l'eliminazione");
      }
      toast.success("Assenza eliminata con successo!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'eliminazione dell'assenza");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const formatTime = (ore: number, minuti: number) => {
    return `${ore}h ${minuti}m`;
  };

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Conferma eliminazione</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <p className="mb-2">
              Sei sicuro di voler eliminare questa assenza?
            </p>
            <div className="bg-base-200 p-3 rounded-lg">
              <p>
                <strong>Utente:</strong> {assenza.user.name}
              </p>
              <p>
                <strong>Tipo:</strong> {ASSENZA_TIPO_LABELS[assenza.tipo] ?? assenza.tipo}
              </p>
              <p>
                <strong>Attività:</strong>{" "}
                {new Date(assenza.attivita.date).toLocaleDateString("it-IT")}
              </p>
              <p>
                <strong>Tempo:</strong>{" "}
                {formatTime(assenza.ore, assenza.minuti)}
              </p>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-error">{error}</p>
          )}
          <div className="modal-action">
            <button type="button" className="btn" onClick={handleClose}>
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
  );
}
