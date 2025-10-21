"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { updateUser } from "@/lib/actions/users.actions";

type ModificaUtenteModalProps = {
  utente: {
    id: string;
    name: string | null;
    phone: string | null | undefined;
    licenseCamion: boolean | null | undefined;
    licenseEscavatore: boolean | null | undefined;
  };
};

export default function ModificaUtenteModal({
  utente,
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

  const { execute, result, reset } = useAction(
    updateUser.bind(null, utente.id),
    {
      onSuccess: () => {
        if (result.data?.success) {
          toast.success("Utente aggiornato con successo!");
          handleClose();
        }
      },
    },
  );

  const openModal = () => {
    reset();
    setName(utente.name || "");
    setPhone(utente.phone || "");
    setLicenseCamion(utente.licenseCamion || false);
    setLicenseEscavatore(utente.licenseEscavatore || false);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    reset();
    dialogRef.current?.close();
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
          <form action={execute}>
            <input type="hidden" name="userId" value={utente.id} />
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
                htmlFor={`telefono-utente-${utente.id}`}
              >
                Telefono
              </label>
              <input
                id={`telefono-utente-${utente.id}`}
                className="input input-bordered w-full"
                type="tel"
                name="phone"
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
                name="licenseCamion"
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
                Salva modifiche
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
