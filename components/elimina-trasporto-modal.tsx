"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type EliminaTrasportoModalProps = {
  trasporto: {
    id: number;
    ore: number;
    minuti: number;
    user: { id: string; name: string };
    mezzi: { id: number; nome: string };
    cantieri_partenza: { id: number; nome: string };
    cantieri_arrivo: { id: number; nome: string };
    attivita: { id: number; date: string };
  };
  onClose: () => void;
  onSuccess?: () => void;
};

export default function EliminaTrasportoModal({
  trasporto,
  onClose,
  onSuccess,
}: EliminaTrasportoModalProps) {
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
      const res = await fetch(`/api/trasporti/${trasporto.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore durante l'eliminazione");
      }
      toast.success("Trasporto eliminato con successo!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore durante l'eliminazione del trasporto",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const formatTime = (ore: number, minuti: number) => `${ore}h ${minuti}m`;

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Conferma eliminazione</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <p className="mb-2">Sei sicuro di voler eliminare questo trasporto?</p>
            <div className="bg-base-200 p-3 rounded-lg">
              <p>
                <strong>Partenza:</strong> {trasporto.cantieri_partenza.nome}
              </p>
              <p>
                <strong>Arrivo:</strong> {trasporto.cantieri_arrivo.nome}
              </p>
              <p>
                <strong>Mezzo:</strong> {trasporto.mezzi.nome}
              </p>
              <p>
                <strong>Utente:</strong> {trasporto.user.name}
              </p>
              <p>
                <strong>Tempo:</strong> {formatTime(trasporto.ore, trasporto.minuti)}
              </p>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
          <div className="modal-action">
            <button type="button" className="btn" onClick={handleClose}>
              Annulla
            </button>
            <button type="submit" className="btn btn-error" disabled={isSubmitting}>
              {isSubmitting && <span className="loading loading-spinner loading-xs" />}
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
