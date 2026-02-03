"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import DashboardChart from "@/components/dashboard-chart";
import AttivitaTable from "@/components/attivita-table";

type DashboardApiResponse = {
  attivita: Array<{
    id: number;
    date: string;
    user_id: string;
    external_id: string;
    cantieriCount: number;
    mezziCount: number;
    totalMilliseconds: number;
    interazioni: Array<{
      cantieri_id: number;
      mezzi_id: number | null;
      tempo_totale: string;
    }>;
    user: { id: string; name: string };
  }>;
  attivitaCount: number;
  cantieriCount: number;
  mezziCount: number;
  days: number;
};

type UsersApiResponse = {
  users: Array<{ id: string; name: string }>;
};

type Intervallo = "7" | "15" | "30";

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Errore nel caricamento");
  }
  return res.json();
};

export default function DashboardWrapper() {
  const [interval, setInterval] = useState<Intervallo>("7");

  const { data: dashboardData, error: dashboardError, isLoading: loadingDashboard } = useSWR<DashboardApiResponse>(
    "/api/dashboard?days=30",
    fetcher,
    { revalidateOnFocus: false },
  );

  const { error: usersError, isLoading: loadingUsers } = useSWR<UsersApiResponse>(
    "/api/users?notBanned=true&limit=500",
    fetcher,
    { revalidateOnFocus: false },
  );

  const data = dashboardData;

  const filteredData = useMemo(() => {
    if (!data?.attivita) {
      return {
        attivita: [],
        attivitaCount: 0,
        cantieriCount: 0,
        mezziCount: 0,
      };
    }
    const now = new Date();
    const intervalDays = parseInt(interval, 10);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - intervalDays);

    const filtered = data.attivita.filter((a) => {
      const attivitaDate = new Date(a.date);
      return attivitaDate >= startDate && attivitaDate <= now;
    });

    const uniqueCantieri = new Set<number>();
    const uniqueMezzi = new Set<number>();

    filtered.forEach((attivita) => {
      attivita.interazioni.forEach((interazione) => {
        uniqueCantieri.add(interazione.cantieri_id);
        if (interazione.mezzi_id) {
          uniqueMezzi.add(interazione.mezzi_id);
        }
      });
    });

    return {
      attivita: filtered,
      attivitaCount: filtered.length,
      cantieriCount: uniqueCantieri.size,
      mezziCount: uniqueMezzi.size,
    };
  }, [data?.attivita, interval]);

  if (loadingDashboard || loadingUsers) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (dashboardError || usersError) {
    return (
      <div className="alert alert-error">
        {dashboardError?.message ?? usersError?.message ?? "Errore nel caricamento"}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <div className="join">
          <button
            type="button"
            onClick={() => setInterval("7")}
            className={`join-item btn btn-sm ${
              interval === "7" ? "btn-active btn-primary" : ""
            }`}
          >
            7gg
          </button>
          <button
            type="button"
            onClick={() => setInterval("15")}
            className={`join-item btn btn-sm ${
              interval === "15" ? "btn-active btn-primary" : ""
            }`}
          >
            15gg
          </button>
          <button
            type="button"
            onClick={() => setInterval("30")}
            className={`join-item btn btn-sm ${
              interval === "30" ? "btn-active btn-primary" : ""
            }`}
          >
            30gg
          </button>
        </div>
      </div>

      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Attività Inserite</div>
          <div className="stat-value">{filteredData.attivitaCount}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Cantieri Attivi</div>
          <div className="stat-value">{filteredData.cantieriCount}</div>
        </div>

        <div className="stat">
          <div className="stat-title">Mezzi Utilizzati</div>
          <div className="stat-value">{filteredData.mezziCount}</div>
        </div>
      </div>

      <DashboardChart attivita={filteredData.attivita} interval={interval} />
    </div>
  );
}
