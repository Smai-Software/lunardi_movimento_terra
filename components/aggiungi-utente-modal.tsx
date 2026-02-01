"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

export default function AggiungiUtenteModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseCamion, setLicenseCamion] = useState(false);
  const [licenseEscavatore, setLicenseEscavatore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const openModal = () => {
    setName("");
    setEmail("");
    setPhone("");
    setLicenseCamion(false);
    setLicenseEscavatore(false);
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    setLicenseCamion(false);
    setLicenseEscavatore(false);
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          licenseCamion,
          licenseEscavatore,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nella creazione");
      }
      toast.success("Utente creato con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/users"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi utente
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-utente-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuovo utente</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="nome-utente"
              >
                Nome
              </label>
              <input
                id="nome-utente"
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
                htmlFor="email-utente"
              >
                Email
              </label>
              <input
                id="email-utente"
                className="input input-bordered w-full"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Inserisci l'email"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="telefono-utente"
              >
                Telefono
              </label>
              <input
                id="telefono-utente"
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
                htmlFor="patente-camion-utente"
              >
                Patente camion
              </label>
              <input
                id="patente-camion-utente"
                className="toggle toggle-success"
                type="checkbox"
                checked={licenseCamion}
                onChange={(e) => setLicenseCamion(e.target.checked)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="patente-escavatore-utente"
              >
                Patente escavatore
              </label>
              <input
                id="patente-escavatore-utente"
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
                  "Crea utente"
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
