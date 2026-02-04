"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

type AggiungiInterazioneModalProps = {
  attivitaId: number;
  userId: string;
  cantieri: Array<{ id: number; nome: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  onSuccess?: () => void;
};

export default function AggiungiInterazioneModal({
  attivitaId,
  userId,
  cantieri,
  mezzi,
  onSuccess,
}: AggiungiInterazioneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCantiereId, setSelectedCantiereId] = useState("");
  const [selectedMezzoId, setSelectedMezzoId] = useState("");
  const [selectedOre, setSelectedOre] = useState(0);
  const [selectedMinuti, setSelectedMinuti] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setSelectedCantiereId("");
    setSelectedMezzoId("");
    setSelectedOre(0);
    setSelectedMinuti(0);
    setNote("");
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setSelectedCantiereId("");
    setSelectedMezzoId("");
    setSelectedOre(0);
    setSelectedMinuti(0);
    setNote("");
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantiereId = selectedCantiereId ? Number(selectedCantiereId) : null;
    if (!cantiereId) {
      setError("Seleziona un cantiere");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/interazioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attivita_id: attivitaId,
          user_id: userId,
          cantieri_id: cantiereId,
          mezzi_id: selectedMezzoId ? Number(selectedMezzoId) : null,
          ore: selectedOre,
          minuti: selectedMinuti,
          note: note.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiunta");
      }
      toast.success("Interazione aggiunta con successo!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={openModal}>
        Aggiungi Interazione
      </button>
      <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Aggiungi interazione</h3>
        <form onSubmit={handleSubmit}>
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
                {Array.from({ length: 24 }, (_, i) => (
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

          {error && (
            <p className="mt-2 text-sm text-error">{error}</p>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-xs" />
              )}
              Aggiungi interazione
            </button>
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
