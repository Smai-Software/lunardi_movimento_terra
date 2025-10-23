"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { updateInterazione } from "@/lib/actions/interazioni.actions";

type ModificaInterazioneModalProps = {
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
  users: Array<{ id: string; name: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  attivita: Array<{ id: number; date: Date }>;
  onClose: () => void;
};

export default function ModificaInterazioneModal({
  interazione,
  users,
  mezzi,
  attivita,
  onClose,
}: ModificaInterazioneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ore, setOre] = useState(interazione.ore);
  const [minuti, setMinuti] = useState(interazione.minuti);
  const [userId, setUserId] = useState(interazione.user.id);
  const [mezziId, setMezziId] = useState<number | null>(
    interazione.mezzi?.id || null,
  );
  const [attivitaId, setAttivitaId] = useState(interazione.attivita.id);

  const { execute, result, reset } = useAction(
    updateInterazione.bind(null, interazione.id),
    {
      onSuccess: () => {
        if (result.data?.success) {
          toast.success("Interazione aggiornata con successo!");
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
        <h3 className="font-bold text-lg mb-2">Modifica interazione</h3>
        <form action={execute}>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`user-interazione-${interazione.id}`}
            >
              Utente *
            </label>
            <select
              id={`user-interazione-${interazione.id}`}
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
              htmlFor={`mezzi-interazione-${interazione.id}`}
            >
              Mezzo
            </label>
            <select
              id={`mezzi-interazione-${interazione.id}`}
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
              htmlFor={`attivita-interazione-${interazione.id}`}
            >
              Attività *
            </label>
            <select
              id={`attivita-interazione-${interazione.id}`}
              className="select select-bordered w-full"
              name="attivita_id"
              value={attivitaId}
              onChange={(e) => setAttivitaId(Number(e.target.value))}
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
                htmlFor={`ore-interazione-${interazione.id}`}
              >
                Ore *
              </label>
              <select
                id={`ore-interazione-${interazione.id}`}
                className="select select-bordered w-full"
                name="ore"
                value={ore}
                onChange={(e) => setOre(Number(e.target.value))}
                required
              >
                {Array.from({ length: 13 }, (_, i) => (
                  <option key={`hour-${i.toString()}`} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor={`minuti-interazione-${interazione.id}`}
              >
                Minuti *
              </label>
              <select
                id={`minuti-interazione-${interazione.id}`}
                className="select select-bordered w-full"
                name="minuti"
                value={minuti}
                onChange={(e) => setMinuti(Number(e.target.value))}
                required
              >
                <option value={0}>00</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={45}>45</option>
              </select>
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
