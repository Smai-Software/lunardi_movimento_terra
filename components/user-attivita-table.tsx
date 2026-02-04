"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api-fetcher";
import { subDays } from "date-fns";

type UserAttivitaTableProps = {
  userId: string;
};

interface AttivitaItem {
  id: number;
  date: string;
  user_id: string;
  external_id: string;
  interazioniCount: number;
  trasportiCount: number;
  assenzeCount: number;
  totalMilliseconds: number;
  user: { id: string; name: string };
}

interface AttivitaResponse {
  attivita: AttivitaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

export default function UserAttivitaTable({ userId }: UserAttivitaTableProps) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const endDate = new Date();
  const startDate = subDays(endDate, 7);
  const dateFrom = startDate.toISOString().split("T")[0];
  const dateTo = endDate.toISOString().split("T")[0];

  const { data, error, isLoading } = useSWR<AttivitaResponse>(
    userId
      ? `/api/attivita?userId=${userId}&dateFrom=${dateFrom}&dateTo=${dateTo}&limit=500`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const attivita = data?.attivita ?? [];
  const pageCount = Math.max(1, Math.ceil(attivita.length / PAGE_SIZE));
  const paginated = useMemo(
    () => attivita.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, attivita],
  );

  const handlePage = (newPage: number) => {
    setPage(newPage, { history: "push" });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto alert alert-error">
        {error.message}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-sm text-base-content/70">
        Visualizza le tue attività inserite negli ultimi 7 giorni
      </p>
      <div className="overflow-x-auto rounded-lg shadow mt-2 content-visibility-auto">
        <table className="table w-full">
          <thead className="bg-base-200">
            <tr>
              <th>Data</th>
              <th className="hidden md:table-cell"># Interazioni</th>
              <th className="hidden md:table-cell"># Trasporti</th>
              <th className="hidden md:table-cell"># Assenze</th>
              <th>Totale ore</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-base-content/60 py-8"
                >
                  Nessuna attività trovata negli ultimi 7 giorni.
                </td>
              </tr>
            ) : (
              paginated.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.date).toLocaleDateString("it-IT")}</td>
                  <td className="hidden md:table-cell">{a.interazioniCount}</td>
                  <td className="hidden md:table-cell">{a.trasportiCount}</td>
                  <td className="hidden md:table-cell">{a.assenzeCount}</td>
                  <td>
                    {(() => {
                      const totalMinutes = Math.floor(
                        Number(a.totalMilliseconds) / (1000 * 60),
                      );
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;
                      return `${hours}h ${minutes}m`;
                    })()}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/attivita/${a.id}`}
                      className="btn btn-sm btn-ghost"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-base-content/70">
            Pagina {page} di {pageCount}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => handlePage(page - 1)}
              disabled={page === 1}
            >
              Indietro
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => handlePage(page + 1)}
              disabled={page === pageCount}
            >
              Avanti
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
