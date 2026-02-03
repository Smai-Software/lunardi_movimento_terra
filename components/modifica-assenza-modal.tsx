"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ASSENZA_TIPI = [
  { value: "FERIE", label: "Ferie" },
  { value: "PERMESSO", label: "Permesso" },
  { value: "CASSA_INTEGRAZIONE", label: "Cassa integrazione" },
  { value: "MUTUA", label: "Mutua" },
  { value: "PATERNITA", label: "Paternità" },
] as const;

type ModificaAssenzaModalProps = {
  assenza: {
    id: number;
    tipo: string;
    ore: number;
    minuti: number;
    note: string | null;
    user: { id: string; name: string };
    attivita: { id: number; date: string };
  };
  attivita: Array<{ id: number; date: string }>;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function ModificaAssenzaModal({
  assenza,
  attivita,
  onClose,
  onSuccess,
}: ModificaAssenzaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tipo, setTipo] = useState(assenza.tipo);
  const [ore, setOre] = useState(assenza.ore);
  const [minuti, setMinuti] = useState(assenza.minuti);
  const [note, setNote] = useState(assenza.note ?? "");
  const [attivitaId, setAttivitaId] = useState(assenza.attivita.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/assenze/${assenza.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          ore,
          minuti,
          attivita_id: attivitaId,
          note: note.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiornamento");
      }
      toast.success("Assenza aggiornata con successo!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Modifica assenza</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`user-assenza-${assenza.id}`}
            >
              Utente
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={assenza.user.name}
              disabled
              readOnly
            />
          </div>

          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`tipo-assenza-${assenza.id}`}
            >
              Tipo *
            </label>
            <select
              id={`tipo-assenza-${assenza.id}`}
              className="select select-bordered w-full"
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              {ASSENZA_TIPI.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`attivita-assenza-${assenza.id}`}
            >
              Attività *
            </label>
            <select
              id={`attivita-assenza-${assenza.id}`}
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
                htmlFor={`ore-assenza-${assenza.id}`}
              >
                Ore *
              </label>
              <select
                id={`ore-assenza-${assenza.id}`}
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
                htmlFor={`minuti-assenza-${assenza.id}`}
              >
                Minuti *
              </label>
              <select
                id={`minuti-assenza-${assenza.id}`}
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
              htmlFor="note-assenza-input"
              className="block font-medium mb-1 text-sm"
            >
              Note
            </label>
            <textarea
              id="note-assenza-input"
              className="textarea textarea-bordered w-full h-24"
              value={note}
              name="note"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && (
            <p className="mt-2 text-sm text-error">{error}</p>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
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
  );
}
