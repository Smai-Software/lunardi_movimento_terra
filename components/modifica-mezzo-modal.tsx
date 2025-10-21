"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { updateMezzo } from "@/lib/actions/mezzi.actions";

type ModificaMezzoModalProps = {
  mezzo: {
    id: number;
    nome: string;
    descrizione: string;
    has_license_camion: boolean;
    has_license_escavatore: boolean;
  };
};

export default function ModificaMezzoModal({ mezzo }: ModificaMezzoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState(mezzo.nome);
  const [descrizione, setDescrizione] = useState(mezzo.descrizione);
  const [hasLicenseCamion, setHasLicenseCamion] = useState(
    mezzo.has_license_camion,
  );
  const [hasLicenseEscavatore, setHasLicenseEscavatore] = useState(
    mezzo.has_license_escavatore,
  );

  const { execute, result, reset } = useAction(
    updateMezzo.bind(null, mezzo.id),
    {
      onExecute: () => {
        // noop
      },
      onSuccess: () => {
        if (result.data?.success) {
          toast.success("Mezzo aggiornato con successo!");
          handleClose();
        }
      },
    },
  );

  const openModal = () => {
    reset();
    setNome(mezzo.nome);
    setDescrizione(mezzo.descrizione);
    setHasLicenseCamion(mezzo.has_license_camion);
    setHasLicenseEscavatore(mezzo.has_license_escavatore);
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
          <h3 className="font-bold text-lg mb-2">Modifica veicolo</h3>
          <form action={execute}>
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
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Inserisci il nome"
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
                name="descrizione"
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
                name="has_license_camion"
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
