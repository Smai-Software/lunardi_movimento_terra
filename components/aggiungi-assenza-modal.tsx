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

type AggiungiAssenzaModalProps = {
  attivitaId: number;
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AggiungiAssenzaModal({
  attivitaId,
  userId,
  onClose,
  onSuccess,
}: AggiungiAssenzaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedOre, setSelectedOre] = useState(8);
  const [selectedMinuti, setSelectedMinuti] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTipo) {
      setError("Seleziona un tipo di assenza");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/assenze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attivita_id: attivitaId,
          user_id: userId,
          tipo: selectedTipo,
          ore: selectedOre,
          minuti: selectedMinuti,
          note: note.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiunta");
      }
      toast.success("Assenza aggiunta con successo!");
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
        <h3 className="font-bold text-lg mb-2">Aggiungi assenza</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor="tipo-assenza"
            >
              Tipo *
            </label>
            <select
              id="tipo-assenza"
              className="select select-bordered w-full"
              name="tipo"
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="ore-assenza"
              >
                Ore *
              </label>
              <select
                id="ore-assenza"
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
                htmlFor="minuti-assenza"
              >
                Minuti *
              </label>
              <select
                id="minuti-assenza"
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
              Aggiungi assenza
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
