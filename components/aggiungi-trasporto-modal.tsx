"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

type AggiungiTrasportoModalProps = {
  attivitaId: number;
  userId: string;
  cantieri: Array<{ id: number; nome: string }>;
  mezziCamion: Array<{ id: number; nome: string }>;
  mezziEscavatore: Array<{ id: number; nome: string }>;
  onSuccess?: () => void;
};

export default function AggiungiTrasportoModal({
  attivitaId,
  userId,
  cantieri,
  mezziCamion,
  mezziEscavatore,
  onSuccess,
}: AggiungiTrasportoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [partenzaId, setPartenzaId] = useState("");
  const [arrivoId, setArrivoId] = useState("");
  const [mezziId, setMezziId] = useState("");
  const [mezziTrasportatoId, setMezziTrasportatoId] = useState("");
  const [ore, setOre] = useState(0);
  const [minuti, setMinuti] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setPartenzaId("");
    setArrivoId("");
    setMezziId("");
    setMezziTrasportatoId("");
    setOre(0);
    setMinuti(0);
    setNote("");
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setPartenzaId("");
    setArrivoId("");
    setMezziId("");
    setMezziTrasportatoId("");
    setOre(0);
    setMinuti(0);
    setNote("");
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const partenza = partenzaId ? Number(partenzaId) : null;
    const arrivo = arrivoId ? Number(arrivoId) : null;
    const mezzo = mezziId ? Number(mezziId) : null;
    if (!partenza || !arrivo || !mezzo) {
      setError("Partenza, arrivo e mezzo sono obbligatori");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/trasporti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attivita_id: attivitaId,
          user_id: userId,
          cantieri_partenza_id: partenza,
          cantieri_arrivo_id: arrivo,
          mezzi_id: mezzo,
          mezzi_trasportato_id: mezziTrasportatoId ? Number(mezziTrasportatoId) : null,
          ore,
          minuti,
          note: note.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiunta");
      }
      toast.success("Trasporto aggiunto con successo!");
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
        Aggiungi Trasporto
      </button>
      <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Aggiungi trasporto</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm" htmlFor="trasporto-partenza">
              Cantiere partenza *
            </label>
            <select
              id="trasporto-partenza"
              className="select select-bordered w-full"
              value={partenzaId}
              onChange={(e) => setPartenzaId(e.target.value)}
              required
            >
              <option value="">Seleziona cantiere</option>
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm" htmlFor="trasporto-arrivo">
              Cantiere arrivo *
            </label>
            <select
              id="trasporto-arrivo"
              className="select select-bordered w-full"
              value={arrivoId}
              onChange={(e) => setArrivoId(e.target.value)}
              required
            >
              <option value="">Seleziona cantiere</option>
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm" htmlFor="trasporto-mezzo">
              Mezzo *
            </label>
            <select
              id="trasporto-mezzo"
              className="select select-bordered w-full"
              value={mezziId}
              onChange={(e) => setMezziId(e.target.value)}
              required
            >
              <option value="">Seleziona mezzo</option>
              {mezziCamion.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm" htmlFor="trasporto-mezzo-trasportato">
              Mezzo trasportato
            </label>
            <select
              id="trasporto-mezzo-trasportato"
              className="select select-bordered w-full"
              value={mezziTrasportatoId}
              onChange={(e) => setMezziTrasportatoId(e.target.value)}
            >
              <option value="">Nessuno</option>
              {mezziEscavatore.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-1 text-sm" htmlFor="trasporto-ore">
                Ore *
              </label>
              <select
                id="trasporto-ore"
                className="select select-bordered w-full"
                value={ore}
                onChange={(e) => setOre(Number(e.target.value))}
                required
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hourValue = i;
                  return (
                    <option key={`ore-${hourValue}`} value={hourValue}>
                      {hourValue}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm" htmlFor="trasporto-minuti">
                Minuti *
              </label>
              <select
                id="trasporto-minuti"
                className="select select-bordered w-full"
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
            <label className="block font-medium mb-1 text-sm" htmlFor="trasporto-note">
              Note
            </label>
            <textarea
              id="trasporto-note"
              className="textarea textarea-bordered w-full h-24"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
          <div className="modal-action">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isSubmitting}>
              Annulla
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting && <span className="loading loading-spinner loading-xs" />}
              Aggiungi trasporto
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
