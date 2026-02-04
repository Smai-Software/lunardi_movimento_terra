"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

type ModificaCantiereModalProps = {
  cantiere: {
    id: number;
    nome: string;
    descrizione: string;
    open: boolean;
  };
  triggerLabel?: React.ReactNode;
  triggerClassName?: string;
  onSuccess?: () => void;
};

export default function ModificaCantiereModal({
  cantiere,
  triggerLabel = "Modifica Cantiere",
  triggerClassName = "btn btn-outline btn-sm",
  onSuccess,
}: ModificaCantiereModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState(cantiere.nome);
  const [descrizione, setDescrizione] = useState(cantiere.descrizione);
  const [open, setOpen] = useState(cantiere.open);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setNome(cantiere.nome);
    setDescrizione(cantiere.descrizione);
    setOpen(cantiere.open);
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
      const res = await fetch(`/api/cantieri/${cantiere.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          descrizione: descrizione.trim(),
          open,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiornamento");
      }
      toast.success("Cantiere aggiornato con successo!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className={triggerClassName} onClick={openModal}>
        {triggerLabel}
      </button>
      <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Modifica cantiere</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`nome-cantiere-${cantiere.id}`}
            >
              Nome
            </label>
            <input
              id={`nome-cantiere-${cantiere.id}`}
              className="input input-bordered w-full"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Inserisci il nome"
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`descrizione-cantiere-${cantiere.id}`}
            >
              Descrizione
            </label>
            <textarea
              id={`descrizione-cantiere-${cantiere.id}`}
              className="textarea textarea-bordered w-full"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Inserisci la descrizione"
            />
          </div>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`open-cantiere-${cantiere.id}`}
            >
              Stato cantiere
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`open-cantiere-${cantiere.id}`}
                className="toggle toggle-success"
                type="checkbox"
                checked={open}
                onChange={(e) => setOpen(e.target.checked)}
              />
              <span className="text-sm">{open ? "Aperto" : "Chiuso"}</span>
            </div>
          </div>
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
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Salva modifiche"
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
