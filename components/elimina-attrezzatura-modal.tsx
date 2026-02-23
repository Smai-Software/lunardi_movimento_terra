"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type EliminaAttrezzaturaModalProps = {
  attrezzatura: {
    id: number;
    nome: string;
  };
  onSuccess?: () => void;
};

export default function EliminaAttrezzaturaModal({
  attrezzatura,
  onSuccess,
}: EliminaAttrezzaturaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

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
      const res = await fetch(`/api/attrezzature/${attrezzatura.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'eliminazione");
      }
      toast.success("Attrezzatura eliminata con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/attrezzature"));
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
        className="btn btn-sm btn-outline btn-error"
        onClick={openModal}
      >
        Elimina
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Conferma eliminazione</h3>
          <form onSubmit={handleSubmit}>
            <p className="mb-3">
              Sei sicuro di voler eliminare &quot;{attrezzatura.nome}&quot;?
            </p>
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
                className="btn btn-error"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Conferma eliminazione"
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
