"use client";

import { PlusIcon } from "lucide-react";
import { useRef, useState } from "react";

type Cantiere = {
  id: number;
  nome: string;
};

type Mezzo = {
  id: number;
  nome: string;
};

type AggiungiInterazioneModalFormProps = {
  availableCantieri: Cantiere[];
  availableMezzi: Mezzo[];
  loadingCantieri: boolean;
  loadingMezzi: boolean;
  onAddInterazione: (
    cantiereId: number,
    mezzoId: number | null,
    ore: number,
    minuti: number,
    note: string,
  ) => void;
};

export default function AggiungiInterazioneModalForm({
  availableCantieri,
  availableMezzi,
  loadingCantieri,
  loadingMezzi,
  onAddInterazione,
}: AggiungiInterazioneModalFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentCantiereId, setCurrentCantiereId] = useState("");
  const [currentMezzoId, setCurrentMezzoId] = useState("");
  const [currentOre, setCurrentOre] = useState(0);
  const [currentMinuti, setCurrentMinuti] = useState(0);
  const [currentNote, setCurrentNote] = useState("");

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    // Reset all fields
    setCurrentCantiereId("");
    setCurrentMezzoId("");
    setCurrentOre(0);
    setCurrentMinuti(0);
    setCurrentNote("");
    dialogRef.current?.close();
  };

  const handleSubmit = () => {
    if (
      !currentCantiereId ||
      currentOre < 0 ||
      currentMinuti < 0 ||
      currentMinuti > 59
    ) {
      return;
    }

    const cantiereId = parseInt(currentCantiereId, 10);
    const mezziId = currentMezzoId ? parseInt(currentMezzoId, 10) : null;

    onAddInterazione(
      cantiereId,
      mezziId,
      currentOre,
      currentMinuti,
      currentNote,
    );

    // Reset all fields except cantiere, then close
    setCurrentMezzoId("");
    setCurrentOre(0);
    setCurrentMinuti(0);
    setCurrentNote("");
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-circle btn-secondary btn-sm btn-"
        onClick={openModal}
      >
        <PlusIcon className="w-5 h-5" />
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Aggiungi Interazione</h3>

          <div className="space-y-4">
            <div className="form-control flex flex-col">
              <label htmlFor="cantiere-select" className="label">
                <span className="label-text font-medium">Cantiere</span>
              </label>
              <select
                id="cantiere-select"
                className="select select-bordered w-full"
                value={currentCantiereId}
                onChange={(e) => setCurrentCantiereId(e.target.value)}
                disabled={loadingCantieri}
                required
              >
                <option value="">Seleziona cantiere</option>
                {availableCantieri.map((cantiere) => (
                  <option key={cantiere.id} value={cantiere.id}>
                    {cantiere.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control flex flex-col">
              <label htmlFor="mezzo-select" className="label">
                <span className="label-text">Mezzo (opzionale)</span>
              </label>
              <select
                id="mezzo-select"
                className="select select-bordered w-full"
                value={currentMezzoId}
                onChange={(e) => setCurrentMezzoId(e.target.value)}
                disabled={loadingMezzi}
              >
                <option value="">Nessuno</option>
                {availableMezzi.map((mezzo) => (
                  <option key={mezzo.id} value={mezzo.id}>
                    {mezzo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label htmlFor="ore-input" className="label">
                  <span className="label-text">Ore</span>
                </label>
                <select
                  id="ore-input"
                  className="select select-bordered"
                  value={currentOre}
                  onChange={(e) =>
                    setCurrentOre(parseInt(e.target.value, 10) || 0)
                  }
                  required
                >
                  {Array.from({ length: 13 }, (_, i) => (
                    <option key={`hour-${i.toString()}`} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label htmlFor="minuti-input" className="label">
                  <span className="label-text">Minuti</span>
                </label>
                <select
                  id="minuti-input"
                  className="select select-bordered"
                  value={currentMinuti}
                  onChange={(e) =>
                    setCurrentMinuti(parseInt(e.target.value, 10) || 0)
                  }
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
              <label htmlFor="note-input" className="label">
                <span className="label-text">Note</span>
              </label>
              <textarea
                id="note-input"
                className="textarea textarea-bordered w-full"
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                name="note"
              ></textarea>
            </div>
          </div>

          <div className="modal-action mt-6">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
            >
              Annulla
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              Aggiungi Interazione
            </button>
          </div>
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
