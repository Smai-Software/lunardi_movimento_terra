"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { createMezzo } from "@/lib/actions/mezzi.actions";

export default function AggiungiMezzoModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [hasLicenseCamion, setHasLicenseCamion] = useState(false);
  const [hasLicenseEscavatore, setHasLicenseEscavatore] = useState(false);

  const { execute, result, reset } = useAction(createMezzo, {
    onSuccess: () => {
      if (result.data?.success) {
        toast.success("Mezzo creato con successo!");
        handleClose();
      }
    },
  });

  const openModal = () => {
    reset();
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setNome("");
    setDescrizione("");
    setHasLicenseCamion(false);
    setHasLicenseEscavatore(false);
    reset();
    dialogRef.current?.close();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi mezzo
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-veicolo-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuovo mezzo</h3>
          <form action={execute}>
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
                name="nome"
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
                name="descrizione"
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
                name="has_license_camion"
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
                name="has_license_escavatore"
                checked={hasLicenseEscavatore}
                onChange={(e) => setHasLicenseEscavatore(e.target.checked)}
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
                Crea mezzo
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
