"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type ModificaAttivitaModalProps = {
  attivita: {
    id: number;
    date: string;
    user_id: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
  /** Quando true (dashboard user), limita la data a max 7 giorni indietro e non futura */
  restrictDateRange?: boolean;
};

export default function ModificaAttivitaModal({
  attivita,
  onClose,
  onSuccess,
  restrictDateRange = false,
}: ModificaAttivitaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedDate, setSelectedDate] = useState(attivita.date);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    setSelectedDate(attivita.date);
  }, [attivita]);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const getTodayLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getMinDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restrictDateRange) {
      if (selectedDate > getTodayLocalDateString()) {
        toast.error("La data non può essere futura");
        return;
      }
      if (selectedDate < getMinDateString()) {
        toast.error("La data non può essere più di 7 giorni indietro");
        return;
      }
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/attivita/${attivita.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          user_id: attivita.user_id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiornamento");
      }
      toast.success("Attività aggiornata con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/attivita"));
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Modifica data</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`date-attivita-${attivita.id}`}
            >
              Data *
            </label>
            <input
              id={`date-attivita-${attivita.id}`}
              type="date"
              className="input input-bordered w-full"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={restrictDateRange ? getMinDateString() : undefined}
              max={restrictDateRange ? getTodayLocalDateString() : undefined}
              required
            />
          </div>
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
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
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Salva modifiche"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" tabIndex={-1} onClick={handleClose}>
          Annulla
        </button>
      </form>
    </dialog>
  );
}
