"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { updateAttivita } from "@/lib/actions/attivita.actions";

type ModificaAttivitaModalProps = {
  attivita: {
    id: number;
    date: string;
    user_id: string;
  };
  onClose: () => void;
};

export default function ModificaAttivitaModal({
  attivita,
  onClose,
}: ModificaAttivitaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedDate, setSelectedDate] = useState(attivita.date);

  const { execute, result, reset } = useAction(
    updateAttivita.bind(null, attivita.id),
    {
      onSuccess: () => {
        if (result.data?.success) {
          toast.success("Attività aggiornata con successo!");
          onClose();
        }
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
        <h3 className="font-bold text-lg mb-2">Modifica data</h3>
        <form action={execute}>
          <input type="hidden" name="user_id" value={attivita.user_id} />
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`date-attivita-${attivita.id}`}
            >
              Data *
            </label>
            <input
              id={`date-attivita-${attivita.id}`}
              type="date"
              className="input input-bordered w-full"
              name="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
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
  );
}
