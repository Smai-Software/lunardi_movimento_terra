"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { banUser, unbanUser } from "@/lib/actions/users.actions";

type BanUserDialogProps = {
  user: {
    id: string;
    name?: string | null;
    banned?: boolean | null | undefined;
  };
};

export default function BanUserDialog({ user }: BanUserDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");

  const isBanned = Boolean(user.banned);

  const {
    execute: executeBan,
    result: resultBan,
    reset: resetBan,
  } = useAction(banUser, {
    onExecute: () => {
      // clear previous errors on new submit
      resetUnban();
    },
    onSuccess: () => {
      if (resultBan.data?.success) {
        toast.success("Utente bloccato con successo");
        handleClose();
      }
    },
  });

  const {
    execute: executeUnban,
    result: resultUnban,
    reset: resetUnban,
  } = useAction(unbanUser, {
    onExecute: () => {
      // clear previous errors on new submit
      resetBan();
    },
    onSuccess: () => {
      if (resultUnban.data?.success) {
        toast.success("Utente sbloccato con successo");
        handleClose();
      }
    },
  });

  const openModal = () => {
    resetBan();
    resetUnban();
    setReason("");
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    resetBan();
    resetUnban();
    setReason("");
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        className={`btn btn-sm btn-outline`}
        onClick={openModal}
      >
        {isBanned ? "Sblocca" : "Blocca"}
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Conferma</h3>
          <form action={isBanned ? executeUnban : executeBan}>
            <p className="mb-3 text-base">
              {isBanned
                ? `Vuoi sbloccare ${user.name ?? "questo utente"}?`
                : `Vuoi bloccare ${user.name ?? "questo utente"}?`}
            </p>
            <input type="hidden" name="userId" value={user.id} />
            {!isBanned && (
              <div className="mb-3">
                <label
                  className="block font-medium mb-1 text-sm"
                  htmlFor={`ban-reason-${user.id}`}
                >
                  Motivo (opzionale)
                </label>
                <textarea
                  id={`ban-reason-${user.id}`}
                  name="reason"
                  className="textarea textarea-bordered w-full"
                  placeholder="Inserisci un motivo (opzionale)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <ValidationErrors result={isBanned ? resultUnban : resultBan} />
            <div className="modal-action">
              <button type="button" className="btn" onClick={handleClose}>
                Annulla
              </button>
              <SubmitButton className="btn btn-primary">
                {isBanned ? "Conferma sblocco" : "Conferma blocco"}
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
