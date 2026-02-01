"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

export default function AggiungiMezzoModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [hasLicenseCamion, setHasLicenseCamion] = useState(false);
  const [hasLicenseEscavatore, setHasLicenseEscavatore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const openModal = () => {
    setNome("");
    setDescrizione("");
    setHasLicenseCamion(false);
    setHasLicenseEscavatore(false);
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setNome("");
    setDescrizione("");
    setHasLicenseCamion(false);
    setHasLicenseEscavatore(false);
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/mezzi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          descrizione: descrizione.trim(),
          has_license_camion: hasLicenseCamion,
          has_license_escavatore: hasLicenseEscavatore,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nella creazione");
      }
      toast.success("Mezzo creato con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/mezzi"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi mezzo
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-veicolo-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuovo mezzo</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="nome-mezzo"
              >
                Nome
              </label>
              <input
                id="nome-mezzo"
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
                htmlFor="descrizione-mezzo"
              >
                Descrizione
              </label>
              <input
                id="descrizione-mezzo"
                className="input input-bordered w-full"
                type="text"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Inserisci la descrizione"
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="patente-camion-mezzo"
              >
                Patente camion
              </label>
              <input
                id="patente-camion-mezzo"
                className="toggle toggle-success"
                type="checkbox"
                checked={hasLicenseCamion}
                onChange={(e) => setHasLicenseCamion(e.target.checked)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="patente-escavatore-mezzo"
              >
                Patente escavatore
              </label>
              <input
                id="patente-escavatore-mezzo"
                className="toggle toggle-success"
                type="checkbox"
                checked={hasLicenseEscavatore}
                onChange={(e) => setHasLicenseEscavatore(e.target.checked)}
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
                  "Crea mezzo"
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
