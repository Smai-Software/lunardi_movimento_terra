"use client";

import { PlusIcon } from "lucide-react";
import { useRef, useState } from "react";

const ASSENZA_TIPI = [
  { value: "FERIE", label: "Ferie" },
  { value: "PERMESSO", label: "Permesso" },
  { value: "CASSA_INTEGRAZIONE", label: "Cassa integrazione" },
  { value: "MUTUA", label: "Mutua" },
  { value: "PATERNITA", label: "Paternità" },
] as const;

type AggiungiAssenzaModalFormProps = {
  onAddAssenza: (tipo: string, ore: number, minuti: number, note: string) => void;
};

export default function AggiungiAssenzaModalForm({
  onAddAssenza,
}: AggiungiAssenzaModalFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentTipo, setCurrentTipo] = useState("");
  const [currentOre, setCurrentOre] = useState(8);
  const [currentMinuti, setCurrentMinuti] = useState(0);
  const [currentNote, setCurrentNote] = useState("");

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setCurrentTipo("");
    setCurrentOre(8);
    setCurrentMinuti(0);
    setCurrentNote("");
    dialogRef.current?.close();
  };

  const handleSubmit = () => {
    if (!currentTipo || currentOre < 0 || currentMinuti < 0 || currentMinuti > 59) {
      return;
    }

    onAddAssenza(currentTipo, currentOre, currentMinuti, currentNote);

    setCurrentOre(8);
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
          <h3 className="font-bold text-lg mb-4">Aggiungi Assenza</h3>

          <div className="space-y-4">
            <div className="form-control flex flex-col">
              <label htmlFor="tipo-assenza-select" className="label">
                <span className="label-text font-medium">Tipo</span>
              </label>
              <select
                id="tipo-assenza-select"
                className="select select-bordered w-full"
                value={currentTipo}
                onChange={(e) => setCurrentTipo(e.target.value)}
                required
              >
                <option value="">Seleziona tipo</option>
                {ASSENZA_TIPI.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label htmlFor="ore-assenza-input" className="label">
                  <span className="label-text">Ore</span>
                </label>
                <select
                  id="ore-assenza-input"
                  className="select select-bordered"
                  value={currentOre}
                  onChange={(e) =>
                    setCurrentOre(parseInt(e.target.value, 10) || 0)
                  }
                  required
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={`hour-${i.toString()}`} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label htmlFor="minuti-assenza-input" className="label">
                  <span className="label-text">Minuti</span>
                </label>
                <select
                  id="minuti-assenza-input"
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
              <label htmlFor="note-assenza-input" className="label">
                <span className="label-text">Note</span>
              </label>
              <textarea
                id="note-assenza-input"
                className="textarea textarea-bordered w-full"
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                name="note"
              />
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
              Aggiungi Assenza
            </button>
          </div>
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
