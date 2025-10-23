"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { deleteAttivita } from "@/lib/actions/attivita.actions";

type EliminaAttivitaModalProps = {
  attivita: {
    id: number;
    date: string;
    user: string;
  };
  onClose: () => void;
};

export default function EliminaAttivitaModal({
  attivita,
  onClose,
}: EliminaAttivitaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { execute, result, reset } = useAction(
    deleteAttivita.bind(null, attivita.id),
    {
      onNavigation: () => {
        toast.success("Attività eliminata con successo!");
      },
    },
  );

  // Open modal when component mounts
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleClose = () => {
    reset();
    dialogRef.current?.close();
    onClose();
  };

  return (
    <dialog ref={dialogRef} className="modal" id="elimina-attivita-modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Elimina attività</h3>
        <p className="mb-4">
          Sei sicuro di voler eliminare l'attività del{" "}
          <strong>{new Date(attivita.date).toLocaleDateString("it-IT")}</strong>{" "}
          per l'utente <strong>{attivita.user}</strong>?
        </p>
        <p className="text-sm text-warning mb-4">
          Questa azione non può essere annullata.
        </p>
        <form action={execute}>
          <ValidationErrors result={result} />
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
            >
              Annulla
            </button>
            <SubmitButton className="btn btn-error">
              Elimina attività
            </SubmitButton>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" tabIndex={-1} onClick={handleClose}>
          Annulla
        </button>
      </form>
    </dialog>
  );
}
