"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { updateAttivita } from "@/lib/actions/attivita.actions";

import type { UserNotBanned } from "@/lib/data/users.data";

type ModificaAttivitaModalProps = {
  attivita: {
    id: number;
    date: string;
    user_id: string;
  };
  users: UserNotBanned[];
  onClose: () => void;
};

export default function ModificaAttivitaModal({
  attivita,
  users,
  onClose,
}: ModificaAttivitaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [date, setDate] = useState(attivita.date);
  const [userId, setUserId] = useState(attivita.user_id);
  const { execute, result, reset } = useAction(
    updateAttivita.bind(null, attivita.id),
    {
      onSuccess: () => {
        if (result.data?.success) {
          toast.success("Attività aggiornata con successo!");
          handleClose();
        }
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
    <dialog ref={dialogRef} className="modal" id="modifica-attivita-modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Modifica attività</h3>
        <form action={execute}>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor="date-attivita"
            >
              Data
            </label>
            <input
              id="date-attivita"
              className="input input-bordered w-full"
              type="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor="user-attivita"
            >
              Utente
            </label>
            <select
              id="user-attivita"
              className="select select-bordered w-full"
              name="user_id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            >
              <option value="">Seleziona un utente</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
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
              Aggiorna attività
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
