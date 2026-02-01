"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

export default function AggiungiCantiereModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const openModal = () => {
    setNome("");
    setDescrizione("");
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setNome("");
    setDescrizione("");
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/cantieri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          descrizione: descrizione.trim(),
          open: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nella creazione");
      }
      toast.success("Cantiere creato con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/cantieri"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi cantiere
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-cantiere-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuovo cantiere</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="nome-cantiere"
              >
                Nome *
              </label>
              <input
                id="nome-cantiere"
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
                htmlFor="descrizione-cantiere"
              >
                Descrizione
              </label>
              <textarea
                id="descrizione-cantiere"
                className="textarea textarea-bordered w-full"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Inserisci la descrizione"
              />
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
                  "Crea cantiere"
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" tabIndex={-1}>
            Annulla
          </button>
        </form>
      </dialog>
    </>
  );
}
