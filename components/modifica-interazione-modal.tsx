"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

type ModificaInterazioneModalProps = {
  interazione: {
    id: number;
    ore: number;
    minuti: number;
    note: string | null;
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
      date: string;
    };
  };
  mezzi: Array<{ id: number; nome: string }>;
  attivita: Array<{ id: number; date: string }>;
  onSuccess?: () => void;
};

export default function ModificaInterazioneModal({
  interazione,
  mezzi,
  attivita,
  onSuccess,
}: ModificaInterazioneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ore, setOre] = useState(interazione.ore);
  const [minuti, setMinuti] = useState(interazione.minuti);
  const [note, setNote] = useState(interazione.note ?? "");
  const [mezziId, setMezziId] = useState<number | null>(
    interazione.mezzi?.id ?? null,
  );
  const [attivitaId, setAttivitaId] = useState(interazione.attivita.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setOre(interazione.ore);
    setMinuti(interazione.minuti);
    setNote(interazione.note ?? "");
    setMezziId(interazione.mezzi?.id ?? null);
    setAttivitaId(interazione.attivita.id);
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/interazioni/${interazione.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ore,
          minuti,
          mezzi_id: mezziId,
          attivita_id: attivitaId,
          note: note.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiornamento");
      }
      toast.success("Interazione aggiornata con successo!");
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
      <button type="button" className="btn btn-sm btn-outline" onClick={openModal}>
        Modifica
      </button>
      <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Modifica interazione</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`user-interazione-${interazione.id}`}
            >
              Utente
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={interazione.user.name}
              disabled
              readOnly
            />
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
              value={mezziId ?? ""}
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
              Salva modifiche
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
