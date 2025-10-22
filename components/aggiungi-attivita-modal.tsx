"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { createAttivita } from "@/lib/actions/attivita.actions";

import type { UserNotBanned } from "@/lib/data/users.data";

type AggiungiAttivitaModalProps = {
  users: UserNotBanned[];
};

export default function AggiungiAttivitaModal({
  users,
}: AggiungiAttivitaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [date, setDate] = useState("");
  const [userId, setUserId] = useState("");

  const { execute, result, reset } = useAction(createAttivita, {
    onSuccess: () => {
      if (result.data?.success) {
        toast.success("Attività creata con successo!");
        handleClose();
      }
    },
  });

  const openModal = () => {
    reset();
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setDate("");
    setUserId("");
    reset();
    dialogRef.current?.close();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi attività
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-attivita-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuova attività</h3>
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
                Crea attività
              </SubmitButton>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" tabIndex={-1}>
            Annulla
          </button>
        </form>
      </dialog>
    </>
  );
}
