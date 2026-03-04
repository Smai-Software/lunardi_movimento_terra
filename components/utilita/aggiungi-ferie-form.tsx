"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function formatDateIt(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return isoDate;
  const day = String(d).padStart(2, "0");
  const month = String(m).padStart(2, "0");
  const year2 = String(y).slice(-2);
  return `${day}/${month}/${year2}`;
}

function getEligibleDaysInRange(
  dateFrom: string,
  dateTo: string,
  includeSaturday: boolean,
): string[] {
  const from = new Date(dateFrom + "T12:00:00");
  const to = new Date(dateTo + "T12:00:00");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return [];
  }
  const out: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    const day = cur.getDay();
    if (day !== 0 && (day !== 6 || includeSaturday)) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      out.push(`${y}-${m}-${d}`);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export default function AggiungiFerieForm() {
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeSaturday, setIncludeSaturday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingUsers(true);
    fetch("/api/users?notBanned=true&limit=500")
      .then((res) => res.json())
      .then((data: { users?: Array<{ id: string; name: string }> }) => {
        if (!cancelled && Array.isArray(data.users)) setUsers(data.users);
      })
      .finally(() => setLoadingUsers(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const eligibleDates = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    return getEligibleDaysInRange(dateFrom, dateTo, includeSaturday);
  }, [dateFrom, dateTo, includeSaturday]);

  const handleSubmit = useCallback(async () => {
    if (!selectedUserId || !dateFrom || !dateTo) {
      toast.error("Compila operatore e intervallo date.");
      return;
    }
    const from = new Date(dateFrom + "T12:00:00");
    const to = new Date(dateTo + "T12:00:00");
    if (from > to) {
      toast.error("La data di inizio deve essere uguale o precedente alla data di fine.");
      return;
    }
    if (eligibleDates.length === 0) {
      toast.error("Nessun giorno eleggibile nell'intervallo (escludendo domeniche e, se non spuntato, i sabati).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/utilita/ferie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          dateFrom,
          dateTo,
          includeSaturday,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        conflicts?: string[];
        createdCount?: number;
      };

      if (!res.ok) {
        if (res.status === 409 && Array.isArray(data.conflicts) && data.conflicts.length > 0) {
          const formatted = data.conflicts.slice(0, 10).map(formatDateIt).join(", ");
          const extra = data.conflicts.length > 10 ? ` e altre ${data.conflicts.length - 10}` : "";
          setError(`Giorni già presenti: ${formatted}${extra}. Nessuna attività creata.`);
          toast.error("Conflitto: esistono già attività per alcune date.");
        } else {
          setError(data.error ?? "Errore durante l'inserimento ferie.");
          toast.error(data.error ?? "Errore durante l'inserimento ferie.");
        }
        return;
      }

      const count = data.createdCount ?? 0;
      toast.success(`Inserite ${count} attività con ferie.`);
      setDateFrom("");
      setDateTo("");
      setSelectedUserId("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
      toast.error("Errore di rete.");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUserId, dateFrom, dateTo, includeSaturday, eligibleDates.length]);

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="form-control flex flex-col">
        <label htmlFor="ferie-user-select" className="label">
          <span className="font-medium">Operatore</span>
        </label>
        <select
          id="ferie-user-select"
          className="select select-bordered w-full max-w-xs"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={loadingUsers}
        >
          <option value="">
            {loadingUsers ? "Caricamento..." : "Seleziona un operatore"}
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="form-control">
          <label htmlFor="ferie-date-from" className="label">
            <span className="font-medium">Data da</span>
          </label>
          <input
            id="ferie-date-from"
            type="date"
            className="input input-bordered w-full max-w-xs"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label htmlFor="ferie-date-to" className="label">
            <span className="font-medium">Data a</span>
          </label>
          <input
            id="ferie-date-to"
            type="date"
            className="input input-bordered w-full max-w-xs"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={includeSaturday}
            onChange={(e) => setIncludeSaturday(e.target.checked)}
          />
          <span className="label-text">Includi sabato</span>
        </label>
      </div>

      {dateFrom && dateTo && (
        <p className="text-sm text-base-content/80">
          Giorni eleggibili nell&apos;intervallo (escluse domeniche
          {includeSaturday ? "" : ", sabati esclusi"}): <strong>{eligibleDates.length}</strong>
        </p>
      )}

      {error && (
        <div className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={
            !selectedUserId ||
            !dateFrom ||
            !dateTo ||
            eligibleDates.length === 0 ||
            isSubmitting
          }
        >
          {isSubmitting && <span className="loading loading-spinner loading-sm" />}
          Inserisci ferie
        </button>
      </div>
    </div>
  );
}
