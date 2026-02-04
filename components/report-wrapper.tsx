"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api-fetcher";

type UsersApiResponse = {
  users: Array<{ id: string; name: string }>;
};

type ReportApiResponse = {
  user: { id: string; name: string };
  range: { startDate: string; endDate: string };
  totals: {
    interazioniMs: string;
    trasportiMs: string;
    assenzeMs: string;
    overallMs: string;
  };
  assenzeByTipoMs: Record<string, string>;
};

const ASSENZA_TIPO_LABELS: Record<string, string> = {
  FERIE: "Ferie",
  PERMESSO: "Permesso",
  CASSA_INTEGRAZIONE: "Cassa integrazione",
  MUTUA: "Mutua",
  PATERNITA: "Paternità",
};

function formatMsToHoursMinutes(msStr: string): string {
  const ms = Number(msStr);
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

type AppliedFilters = {
  userId: string;
  startDate: string;
  endDate: string;
};

export default function ReportWrapper() {
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(null);

  const { data: usersData, error: usersError, isLoading: loadingUsers } = useSWR<UsersApiResponse>(
    "/api/users?notBanned=true&limit=500",
    fetcher,
    { revalidateOnFocus: false },
  );

  const reportParams = appliedFilters
    ? `userId=${encodeURIComponent(appliedFilters.userId)}&startDate=${encodeURIComponent(appliedFilters.startDate)}&endDate=${encodeURIComponent(appliedFilters.endDate)}`
    : null;

  const {
    data: reportData,
    error: reportError,
    isLoading: loadingReport,
  } = useSWR<ReportApiResponse>(
    reportParams ? `/api/report?${reportParams}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const canApply = Boolean(userId && startDate && endDate);

  const handleApply = () => {
    if (!canApply) return;
    setAppliedFilters({ userId, startDate, endDate });
  };

  if (loadingUsers) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="alert alert-error">
        {usersError.message ?? "Errore nel caricamento utenti"}
      </div>
    );
  }

  const users = usersData?.users ?? [];

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow border border-gray-200">
        <div className="card-body">
          <h2 className="card-title text-lg">Filtri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label" htmlFor="report-user">
                <span className="label-text">Utente</span>
              </label>
              <select
                id="report-user"
                className="select select-bordered w-full"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Seleziona utente</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label" htmlFor="report-start">
                <span className="label-text">Data inizio</span>
              </label>
              <input
                id="report-start"
                type="date"
                className="input input-bordered w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="report-end">
                <span className="label-text">Data fine</span>
              </label>
              <input
                id="report-end"
                type="date"
                className="input input-bordered w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="card-actions justify-end mt-4">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canApply}
              onClick={handleApply}
            >
              Applica
            </button>
          </div>
        </div>
      </div>

      {reportParams && loadingReport && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {reportParams && reportError && (
        <div className="alert alert-error">
          {reportError.message ?? "Errore nel caricamento del report"}
        </div>
      )}

      {reportParams && reportData && (
        <div className="space-y-4">

          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-title">Totale ore</div>
              <div className="stat-value text-primary">
                {formatMsToHoursMinutes(reportData.totals.overallMs)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Interazioni</div>
              <div className="stat-value">
                {formatMsToHoursMinutes(reportData.totals.interazioniMs)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Trasporti</div>
              <div className="stat-value">
                {formatMsToHoursMinutes(reportData.totals.trasportiMs)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">Totale assenze</div>
              <div className="stat-value">
                {formatMsToHoursMinutes(reportData.totals.assenzeMs)}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow border border-gray-200">
            <div className="card-body">
              <h3 className="card-title text-lg">Dettagli assenze</h3>
              <ul className="space-y-2">
                {Object.entries(reportData.assenzeByTipoMs).map(([tipo, msStr]) => (
                  <li
                    key={tipo}
                    className="flex justify-between items-center py-2 border-b border-base-200 last:border-0"
                  >
                    <span>{ASSENZA_TIPO_LABELS[tipo] ?? tipo}</span>
                    <span className="font-medium">
                      {formatMsToHoursMinutes(msStr)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
