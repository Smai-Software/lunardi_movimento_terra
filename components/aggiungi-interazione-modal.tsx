"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { createInterazione } from "@/lib/actions/interazioni.actions";

type AggiungiInterazioneModalProps = {
  cantieriId: number;
  users: Array<{ id: string; name: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  attivita: Array<{ id: number; date: Date }>;
};

export default function AggiungiInterazioneModal({
  cantieriId,
  users,
  mezzi,
  attivita,
}: AggiungiInterazioneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ore, setOre] = useState(0);
  const [minuti, setMinuti] = useState(0);
  const [userId, setUserId] = useState("");
  const [mezziId, setMezziId] = useState<number | null>(null);
  const [attivitaId, setAttivitaId] = useState<number | null>(null);

  const { execute, result, reset } = useAction(createInterazione, {
    onSuccess: () => {
      if (result.data?.success) {
        toast.success("Interazione creata con successo!");
        handleClose();
      }
    },
  });

  const openModal = () => {
    reset();
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setOre(0);
    setMinuti(0);
    setUserId("");
    setMezziId(null);
    setAttivitaId(null);
    reset();
    dialogRef.current?.close();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi Interazione
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-interazione-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuova interazione</h3>
          <form action={execute}>
            <input type="hidden" name="cantieri_id" value={cantieriId} />

            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="user-interazione"
              >
                Utente *
              </label>
              <select
                id="user-interazione"
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

            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="mezzi-interazione"
              >
                Mezzo
              </label>
              <select
                id="mezzi-interazione"
                className="select select-bordered w-full"
                name="mezzi_id"
                value={mezziId || ""}
                onChange={(e) =>
                  setMezziId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Nessun mezzo</option>
                {mezzi.map((mezzo) => (
                  <option key={mezzo.id} value={mezzo.id}>
                    {mezzo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="attivita-interazione"
              >
                Attività *
              </label>
              <select
                id="attivita-interazione"
                className="select select-bordered w-full"
                name="attivita_id"
                value={attivitaId || ""}
                onChange={(e) =>
                  setAttivitaId(e.target.value ? Number(e.target.value) : null)
                }
                required
              >
                <option value="">Seleziona un'attività</option>
                {attivita.map((att) => (
                  <option key={att.id} value={att.id}>
                    {new Date(att.date).toLocaleDateString("it-IT")}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  className="block font-medium mb-1 text-sm"
                  htmlFor="ore-interazione"
                >
                  Ore *
                </label>
                <input
                  id="ore-interazione"
                  className="input input-bordered w-full"
                  type="number"
                  name="ore"
                  value={ore}
                  onChange={(e) => setOre(Number(e.target.value))}
                  min="0"
                  required
                />
              </div>
              <div>
                <label
                  className="block font-medium mb-1 text-sm"
                  htmlFor="minuti-interazione"
                >
                  Minuti *
                </label>
                <input
                  id="minuti-interazione"
                  className="input input-bordered w-full"
                  type="number"
                  name="minuti"
                  value={minuti}
                  onChange={(e) => setMinuti(Number(e.target.value))}
                  min="0"
                  max="59"
                  required
                />
              </div>
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
                Crea interazione
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
