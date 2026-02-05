"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

type ModificaTrasportoModalProps = {
  trasporto: {
    id: number;
    ore: number;
    minuti: number;
    note: string | null;
    user: { id: string; name: string };
    mezzi: { id: number; nome: string };
    mezzi_trasportato?: { id: number; nome: string } | null;
    cantieri_partenza: { id: number; nome: string };
    cantieri_arrivo: { id: number; nome: string };
    attivita: { id: number; date: string };
  };
  cantieri: Array<{ id: number; nome: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  onSuccess?: () => void;
};

export default function ModificaTrasportoModal({
  trasporto,
  cantieri,
  mezzi,
  onSuccess,
}: ModificaTrasportoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [ore, setOre] = useState(trasporto.ore);
  const [minuti, setMinuti] = useState(trasporto.minuti);
  const [note, setNote] = useState(trasporto.note ?? "");
  const [partenzaId, setPartenzaId] = useState(trasporto.cantieri_partenza.id);
  const [arrivoId, setArrivoId] = useState(trasporto.cantieri_arrivo.id);
  const [mezziId, setMezziId] = useState(trasporto.mezzi.id);
  const [mezziTrasportatoId, setMezziTrasportatoId] = useState<number | null>(
    trasporto.mezzi_trasportato?.id ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setOre(trasporto.ore);
    setMinuti(trasporto.minuti);
    setNote(trasporto.note ?? "");
    setPartenzaId(trasporto.cantieri_partenza.id);
    setArrivoId(trasporto.cantieri_arrivo.id);
    setMezziId(trasporto.mezzi.id);
    setMezziTrasportatoId(trasporto.mezzi_trasportato?.id ?? null);
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (partenzaId === arrivoId) {
      setError("Cantiere partenza e arrivo devono essere diversi");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trasporti/${trasporto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantieri_partenza_id: partenzaId,
          cantieri_arrivo_id: arrivoId,
          mezzi_id: mezziId,
          mezzi_trasportato_id: mezziTrasportatoId ?? null,
          ore,
          minuti,
          note: note.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'aggiornamento");
      }
      toast.success("Trasporto aggiornato con successo!");
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
        <h3 className="font-bold text-lg mb-2">Modifica trasporto</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm">Utente</label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={trasporto.user.name}
              disabled
              readOnly
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm" htmlFor="mod-trasporto-partenza">
              Cantiere partenza *
            </label>
            <select
              id="mod-trasporto-partenza"
              className="select select-bordered w-full"
              value={partenzaId}
              onChange={(e) => setPartenzaId(Number(e.target.value))}
              required
            >
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm" htmlFor="mod-trasporto-arrivo">
              Cantiere arrivo *
            </label>
            <select
              id="mod-trasporto-arrivo"
              className="select select-bordered w-full"
              value={arrivoId}
              onChange={(e) => setArrivoId(Number(e.target.value))}
              required
            >
              {cantieri.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm" htmlFor="mod-trasporto-mezzo">
              Mezzo *
            </label>
            <select
              id="mod-trasporto-mezzo"
              className="select select-bordered w-full"
              value={mezziId}
              onChange={(e) => setMezziId(Number(e.target.value))}
              required
            >
              {mezzi.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1 text-sm" htmlFor="mod-trasporto-mezzo-trasportato">
              Mezzo trasportato
            </label>
            <select
              id="mod-trasporto-mezzo-trasportato"
              className="select select-bordered w-full"
              value={mezziTrasportatoId ?? ""}
              onChange={(e) =>
                setMezziTrasportatoId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Nessuno</option>
              {mezzi.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-1 text-sm">Ore *</label>
              <select
                className="select select-bordered w-full"
                value={ore}
                onChange={(e) => setOre(Number(e.target.value))}
                required
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm">Minuti *</label>
              <select
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
            <label className="block font-medium mb-1 text-sm">Note</label>
            <textarea
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
