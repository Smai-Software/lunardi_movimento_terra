"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

export default function AggiungiAttrezzaturaModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const openModal = () => {
    setNome("");
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setNome("");
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/attrezzature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nella creazione");
      }
      toast.success("Attrezzatura creata con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/attrezzature"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi attrezzatura
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-attrezzatura-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuova attrezzatura</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="nome-attrezzatura"
              >
                Nome
              </label>
              <input
                id="nome-attrezzatura"
                className="input input-bordered w-full"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Inserisci il nome"
                required
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
                  "Crea attrezzatura"
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
