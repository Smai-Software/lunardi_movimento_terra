"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { createInterazione } from "@/lib/actions/interazioni.actions";

type AggiungiInterazioneModalProps = {
  attivitaId: number;
  userId: string;
  cantieri: Array<{ id: number; nome: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  onClose: () => void;
};

export default function AggiungiInterazioneModal({
  attivitaId,
  userId,
  cantieri,
  mezzi,
  onClose,
}: AggiungiInterazioneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCantiereId, setSelectedCantiereId] = useState("");
  const [selectedMezzoId, setSelectedMezzoId] = useState("");
  const [selectedOre, setSelectedOre] = useState(0);
  const [selectedMinuti, setSelectedMinuti] = useState(0);
  const [note, setNote] = useState("");

  const { execute, result, reset } = useAction(createInterazione, {
    onSuccess: () => {
      if (result.data?.success) {
        toast.success("Interazione aggiunta con successo!");
        onClose();
      }
    },
  });

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
        <h3 className="font-bold text-lg mb-2">Aggiungi interazione</h3>
        <form action={execute}>
          <input type="hidden" name="attivita_id" value={attivitaId} />
          <input type="hidden" name="user_id" value={userId} />

          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor="cantiere-interazione"
            >
              Cantiere *
            </label>
            <select
              id="cantiere-interazione"
              className="select select-bordered w-full"
              name="cantieri_id"
              value={selectedCantiereId}
              onChange={(e) => setSelectedCantiereId(e.target.value)}
              required
            >
              <option value="">Seleziona un cantiere</option>
              {cantieri.map((cantiere) => (
                <option key={cantiere.id} value={cantiere.id}>
                  {cantiere.nome}
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
              value={selectedMezzoId}
              onChange={(e) => setSelectedMezzoId(e.target.value)}
            >
              <option value="">Nessun mezzo</option>
              {mezzi.map((mezzo) => (
                <option key={mezzo.id} value={mezzo.id}>
                  {mezzo.nome}
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
              <select
                id="ore-interazione"
                className="select select-bordered w-full"
                name="ore"
                value={selectedOre}
                onChange={(e) => setSelectedOre(Number(e.target.value))}
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
                htmlFor="minuti-interazione"
              >
                Minuti *
              </label>
              <select
                id="minuti-interazione"
                className="select select-bordered w-full"
                name="minuti"
                value={selectedMinuti}
                onChange={(e) => setSelectedMinuti(Number(e.target.value))}
                required
              >
                <option value={0}>00</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={45}>45</option>
              </select>
            </div>
          </div>
          <div className="form-control">
            <label
              htmlFor="note-input"
              className="block font-medium mb-1 text-sm"
            >
              Note
            </label>
            <textarea
              id="note-input"
              className="textarea textarea-bordered w-full h-24"
              value={note}
              name="note"
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
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
              Aggiungi interazione
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
