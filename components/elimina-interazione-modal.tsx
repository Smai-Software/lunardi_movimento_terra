"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { deleteInterazione } from "@/lib/actions/interazioni.actions";

type EliminaInterazioneModalProps = {
  interazione: {
    id: number;
    ore: number;
    minuti: number;
    user: {
      id: string;
      name: string;
    };
    mezzi: {
      id: number;
      nome: string;
    } | null;
    attivita: {
      id: number;
      date: Date;
    };
  };
  onClose: () => void;
};

export default function EliminaInterazioneModal({
  interazione,
  onClose,
}: EliminaInterazioneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { execute, result, reset } = useAction(
    deleteInterazione.bind(null, interazione.id),
    {
      onError: () => {
        toast.error("Errore durante l'eliminazione dell'interazione");
      },
      onSuccess: () => {
        toast.success("Interazione eliminata con successo!");
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

  const formatTime = (ore: number, minuti: number) => {
    return `${ore}h ${minuti}m`;
  };

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Conferma eliminazione</h3>
        <form action={execute}>
          <div className="mb-3">
            <p className="mb-2">
              Sei sicuro di voler eliminare questa interazione?
            </p>
            <div className="bg-base-200 p-3 rounded-lg">
              <p>
                <strong>Utente:</strong> {interazione.user.name}
              </p>
              <p>
                <strong>Mezzo:</strong> {interazione.mezzi?.nome || "Nessuno"}
              </p>
              <p>
                <strong>Attività:</strong>{" "}
                {new Date(interazione.attivita.date).toLocaleDateString(
                  "it-IT",
                )}
              </p>
              <p>
                <strong>Tempo:</strong>{" "}
                {formatTime(interazione.ore, interazione.minuti)}
              </p>
            </div>
          </div>
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
