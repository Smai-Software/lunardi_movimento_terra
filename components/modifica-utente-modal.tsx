"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type ModificaUtenteModalProps = {
  utente: {
    id: string;
    name: string | null;
    phone: string | null | undefined;
    licenseCamion: boolean | null | undefined;
    licenseEscavatore: boolean | null | undefined;
  };
  onSuccess?: () => void;
};

export default function ModificaUtenteModal({
  utente,
  onSuccess,
}: ModificaUtenteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(utente.name || "");
  const [phone, setPhone] = useState(utente.phone || "");
  const [licenseCamion, setLicenseCamion] = useState(
    utente.licenseCamion || false,
  );
  const [licenseEscavatore, setLicenseEscavatore] = useState(
    utente.licenseEscavatore || false,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    setName(utente.name || "");
    setPhone(utente.phone || "");
    setLicenseCamion(utente.licenseCamion || false);
    setLicenseEscavatore(utente.licenseEscavatore || false);
  }, [utente]);

  const openModal = () => {
    setName(utente.name || "");
    setPhone(utente.phone || "");
    setLicenseCamion(utente.licenseCamion || false);
    setLicenseEscavatore(utente.licenseEscavatore || false);
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
      const res = await fetch(`/api/users/${utente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || "",
          licenseCamion,
          licenseEscavatore,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiornamento");
      }
      toast.success("Utente aggiornato con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/users"));
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
          <h3 className="font-bold text-lg mb-2">Modifica utente</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor={`nome-utente-${utente.id}`}
              >
                Nome
              </label>
              <input
                id={`nome-utente-${utente.id}`}
                className="input input-bordered w-full"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Inserisci il nome"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor={`telefono-utente-${utente.id}`}
              >
                Telefono
              </label>
              <input
                id={`telefono-utente-${utente.id}`}
                className="input input-bordered w-full"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Inserisci il telefono"
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor={`patente-camion-utente-${utente.id}`}
              >
                Patente camion
              </label>
              <input
                id={`patente-camion-utente-${utente.id}`}
                className="toggle toggle-success"
                type="checkbox"
                checked={licenseCamion}
                onChange={(e) => setLicenseCamion(e.target.checked)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor={`patente-escavatore-utente-${utente.id}`}
              >
                Patente escavatore
              </label>
              <input
                id={`patente-escavatore-utente-${utente.id}`}
                className="toggle toggle-success"
                type="checkbox"
                checked={licenseEscavatore}
                onChange={(e) => setLicenseEscavatore(e.target.checked)}
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
