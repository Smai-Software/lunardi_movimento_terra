"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { deleteCantiere } from "@/lib/actions/cantieri.actions";

type EliminaCantiereModalProps = {
  cantiere: {
    id: number;
    nome: string;
  };
  onClose: () => void;
};

export default function EliminaCantiereModal({
  cantiere,
  onClose,
}: EliminaCantiereModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { execute, result, reset } = useAction(
    deleteCantiere.bind(null, cantiere.id),
    {
      onError: () => {
        toast.error("Errore durante l'eliminazione del cantiere");
      },
      onSuccess: () => {
        toast.success("Cantiere eliminato con successo!");
        onClose();
      },
    },
  );

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Conferma eliminazione</h3>
        <form action={execute}>
          <p className="mb-3">
            Sei sicuro di voler eliminare &quot;{cantiere.nome}&quot;?
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
  );
}
