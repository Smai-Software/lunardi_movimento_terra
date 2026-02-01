"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type ModificaMezzoModalProps = {
  mezzo: {
    id: number;
    nome: string;
    descrizione: string;
    has_license_camion: boolean;
    has_license_escavatore: boolean;
  };
  onSuccess?: () => void;
};

export default function ModificaMezzoModal({
  mezzo,
  onSuccess,
}: ModificaMezzoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState(mezzo.nome);
  const [descrizione, setDescrizione] = useState(mezzo.descrizione);
  const [hasLicenseCamion, setHasLicenseCamion] = useState(
    mezzo.has_license_camion,
  );
  const [hasLicenseEscavatore, setHasLicenseEscavatore] = useState(
    mezzo.has_license_escavatore,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    setNome(mezzo.nome);
    setDescrizione(mezzo.descrizione);
    setHasLicenseCamion(mezzo.has_license_camion);
    setHasLicenseEscavatore(mezzo.has_license_escavatore);
  }, [mezzo]);

  const openModal = () => {
    setNome(mezzo.nome);
    setDescrizione(mezzo.descrizione);
    setHasLicenseCamion(mezzo.has_license_camion);
    setHasLicenseEscavatore(mezzo.has_license_escavatore);
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
      const res = await fetch(`/api/mezzi/${mezzo.id}`, {
        method: "PUT",
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
        throw new Error((data as { error?: string }).error || "Errore nell'aggiornamento");
      }
      toast.success("Mezzo aggiornato con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/mezzi"));
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
        Modifica
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Modifica veicolo</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor={`nome-veicolo-${mezzo.id}`}
              >
                Nome
              </label>
              <input
                id={`nome-veicolo-${mezzo.id}`}
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
                htmlFor={`descrizione-veicolo-${mezzo.id}`}
              >
                Descrizione
              </label>
              <input
                id={`descrizione-veicolo-${mezzo.id}`}
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
                htmlFor={`patente-camion-mezzo-${mezzo.id}`}
              >
                Patente camion
              </label>
              <input
                id={`patente-camion-mezzo-${mezzo.id}`}
                className="toggle toggle-success"
                type="checkbox"
                checked={hasLicenseCamion}
                onChange={(e) => setHasLicenseCamion(e.target.checked)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor={`patente-escavatore-mezzo-${mezzo.id}`}
              >
                Patente escavatore
              </label>
              <input
                id={`patente-escavatore-mezzo-${mezzo.id}`}
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
