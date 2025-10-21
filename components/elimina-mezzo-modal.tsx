"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { deleteMezzo } from "@/lib/actions/mezzi.actions";

type EliminaMezzoModalProps = {
  mezzo: {
    id: number;
    nome: string;
  };
};

export default function EliminaMezzoModal({ mezzo }: EliminaMezzoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { execute, result, reset } = useAction(
    deleteMezzo.bind(null, mezzo.id),
    {
      onSuccess: () => {
        if (result.data?.success) {
          toast.success("Mezzo eliminato con successo!");
          handleClose();
        }
      },
    },
  );

  const openModal = () => {
    reset();
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
        className="btn btn-sm btn-outline btn-error"
        onClick={openModal}
      >
        Elimina
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Conferma eliminazione</h3>
          <form action={execute}>
            <p className="mb-3">
              Sei sicuro di voler eliminare &quot;{mezzo.nome}&quot;?
            </p>
            <ValidationErrors result={result} />
            <div className="modal-action">
              <button type="button" className="btn" onClick={handleClose}>
                Annulla
              </button>
              <SubmitButton className="btn btn-error">
                Conferma eliminazione
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
