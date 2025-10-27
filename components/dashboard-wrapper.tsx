"use client";

import { useMemo, useState } from "react";
import DashboardChart from "@/components/dashboard-chart";
import AttivitaTable from "@/components/attivita-table";
import type { DashboardData } from "@/lib/data/dashboard.data";
import type { UserNotBanned } from "@/lib/data/users.data";

type DashboardWrapperProps = {
  data: DashboardData;
  users: UserNotBanned[];
};

type Intervallo = "7" | "15" | "30";

export default function DashboardWrapper({
  data,
  users,
}: DashboardWrapperProps) {
  const [interval, setInterval] = useState<Intervallo>("7");

  const filteredData = useMemo(() => {
    const now = new Date();
    const intervalDays = parseInt(interval, 10);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - intervalDays);

    const filtered = data.attivita.filter((a) => {
      const attivitaDate = new Date(a.date);
      return attivitaDate >= startDate && attivitaDate <= now;
    });

    // Calculate stats for the filtered period
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
  }, [data.attivita, interval]);

  return (
    <div>
      {/* Interval Selection Tabs */}
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

      <div className="mt-6">
        <AttivitaTable attivita={filteredData.attivita} users={users} />
      </div>
    </div>
  );
}
