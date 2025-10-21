"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { createUser } from "@/lib/actions/users.actions";

export default function AggiungiUtenteModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseCamion, setLicenseCamion] = useState(false);
  const [licenseEscavatore, setLicenseEscavatore] = useState(false);
  const { execute, result, reset } = useAction(createUser, {
    onSuccess: () => {
      if (result.data?.success) {
        toast.success("Utente creato con successo!");
        handleClose();
      }
    },
  });

  const openModal = () => {
    reset();
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    setLicenseCamion(false);
    setLicenseEscavatore(false);
    reset();
    dialogRef.current?.close();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi utente
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-utente-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuovo utente</h3>
          <form action={execute}>
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
                name="name"
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
                name="email"
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
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Inserisci il telefono"
                required
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
                name="licenseCamion"
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
                name="licenseEscavatore"
                checked={licenseEscavatore}
                onChange={(e) => setLicenseEscavatore(e.target.checked)}
              />
            </div>
            <ValidationErrors result={result} />
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClose}
              >
                Annulla
              </button>
              <SubmitButton className="btn btn-primary">
                Crea utente
              </SubmitButton>
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
