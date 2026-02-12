"use client";

import { PlusIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type Cantiere = {
  id: number;
  nome: string;
};

type Mezzo = {
  id: number;
  nome: string;
};

type AggiungiTrasportoModalFormProps = {
  availableCantieri: Cantiere[];
  availableMezziCamion: Mezzo[];
  availableMezziEscavatore: Mezzo[];
  loadingCantieri: boolean;
  loadingMezzi: boolean;
  onAddTrasporto: (
    cantieriPartenzaId: number,
    cantieriArrivoId: number,
    mezziId: number,
    ore: number,
    minuti: number,
    note: string,
    mezziTrasportatoId: number | null,
  ) => void;
};

export default function AggiungiTrasportoModalForm({
  availableCantieri,
  availableMezziCamion,
  availableMezziEscavatore,
  loadingCantieri,
  loadingMezzi,
  onAddTrasporto,
}: AggiungiTrasportoModalFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentPartenzaId, setCurrentPartenzaId] = useState("");
  const [currentArrivoId, setCurrentArrivoId] = useState("");
  const [currentMezzoId, setCurrentMezzoId] = useState("");
  const [currentMezzoTrasportatoId, setCurrentMezzoTrasportatoId] = useState("");
  const [currentOre, setCurrentOre] = useState(0);
  const [currentMinuti, setCurrentMinuti] = useState(0);
  const [currentNote, setCurrentNote] = useState("");

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setCurrentPartenzaId("");
    setCurrentArrivoId("");
    setCurrentMezzoId("");
    setCurrentMezzoTrasportatoId("");
    setCurrentOre(0);
    setCurrentMinuti(0);
    setCurrentNote("");
    dialogRef.current?.close();
  };

  const handleSubmit = () => {
    if (
      !currentPartenzaId ||
      !currentArrivoId ||
      !currentMezzoId ||
      currentOre < 0 ||
      currentMinuti < 0 ||
      currentMinuti > 59
    ) {
      toast.error("Compila tutti i campi obbligatori (partenza, arrivo, mezzo, tempo)");
      return;
    }
    const partenzaId = parseInt(currentPartenzaId, 10);
    const arrivoId = parseInt(currentArrivoId, 10);
    const mezziId = parseInt(currentMezzoId, 10);
    const mezzoTrasportatoId = currentMezzoTrasportatoId
      ? parseInt(currentMezzoTrasportatoId, 10)
      : null;
    onAddTrasporto(
      partenzaId,
      arrivoId,
      mezziId,
      currentOre,
      currentMinuti,
      currentNote,
      mezzoTrasportatoId,
    );
    handleClose();
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-circle btn-secondary btn-sm"
        onClick={openModal}
      >
        <PlusIcon className="w-5 h-5" />
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Aggiungi Trasporto</h3>

          <div className="space-y-4">
            <div className="form-control flex flex-col">
              <label htmlFor="trasporto-partenza" className="label">
                <span className="label-text font-medium">Cantiere partenza *</span>
              </label>
              <select
                id="trasporto-partenza"
                className="select select-bordered w-full"
                value={currentPartenzaId}
                onChange={(e) => setCurrentPartenzaId(e.target.value)}
                disabled={loadingCantieri}
                required
              >
                <option value="">Seleziona cantiere</option>
                {availableCantieri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control flex flex-col">
              <label htmlFor="trasporto-arrivo" className="label">
                <span className="label-text font-medium">Cantiere arrivo *</span>
              </label>
              <select
                id="trasporto-arrivo"
                className="select select-bordered w-full"
                value={currentArrivoId}
                onChange={(e) => setCurrentArrivoId(e.target.value)}
                disabled={loadingCantieri}
                required
              >
                <option value="">Seleziona cantiere</option>
                {availableCantieri.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control flex flex-col">
              <label htmlFor="trasporto-mezzo" className="label">
                <span className="label-text font-medium">Mezzo *</span>
              </label>
              <select
                id="trasporto-mezzo"
                className="select select-bordered w-full"
                value={currentMezzoId}
                onChange={(e) => setCurrentMezzoId(e.target.value)}
                disabled={loadingMezzi}
                required
              >
                <option value="">Seleziona mezzo</option>
                {availableMezziCamion.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control flex flex-col">
              <label htmlFor="trasporto-mezzo-trasportato" className="label">
                <span className="label-text font-medium">Mezzo trasportato</span>
              </label>
              <select
                id="trasporto-mezzo-trasportato"
                className="select select-bordered w-full"
                value={currentMezzoTrasportatoId}
                onChange={(e) => setCurrentMezzoTrasportatoId(e.target.value)}
                disabled={loadingMezzi}
              >
                <option value="">Nessuno</option>
                {availableMezziEscavatore.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label htmlFor="trasporto-ore" className="label">
                  <span className="label-text">Ore</span>
                </label>
                <select
                  id="trasporto-ore"
                  className="select select-bordered"
                  value={currentOre}
                  onChange={(e) => setCurrentOre(parseInt(e.target.value, 10) || 0)}
                  required
                >
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label htmlFor="trasporto-minuti" className="label">
                  <span className="label-text">Minuti</span>
                </label>
                <select
                  id="trasporto-minuti"
                  className="select select-bordered"
                  value={currentMinuti}
                  onChange={(e) => setCurrentMinuti(parseInt(e.target.value, 10) || 0)}
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
              <label htmlFor="trasporto-note" className="label">
                <span className="label-text">Note</span>
              </label>
              <textarea
                id="trasporto-note"
                className="textarea textarea-bordered w-full"
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-action mt-6">
            <button type="button" className="btn btn-outline" onClick={handleClose}>
              Annulla
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              Aggiungi Trasporto
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
