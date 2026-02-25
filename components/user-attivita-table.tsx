"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import useSWR from "swr";
import { fetcher } from "@/lib/api-fetcher";

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

const PAGE_SIZE = 7;

export default function UserAttivitaTable({ userId }: UserAttivitaTableProps) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const apiUrl = userId
    ? `/api/attivita?userId=${userId}&page=${page}&limit=${PAGE_SIZE}&sortBy=date&sortOrder=desc`
    : null;

  const { data, error, isLoading } = useSWR<AttivitaResponse>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false },
  );

  const attivita = data?.attivita ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

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
        Visualizza le tue attività
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
            {attivita.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-base-content/60 py-8"
                >
                  Nessuna attività trovata.
                </td>
              </tr>
            ) : (
              attivita.map((a) => (
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

      {totalPages > 1 ? (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-base-content/70">
            Pagina {page} di {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setPage(1, { history: "push" })}
              disabled={page === 1}
              title="Prima pagina"
            >
              <ChevronsLeft className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() =>
                setPage(Math.max(1, page - 1), { history: "push" })
              }
              disabled={page === 1}
              title="Pagina precedente"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() =>
                setPage(Math.min(totalPages, page + 1), { history: "push" })
              }
              disabled={page === totalPages}
              title="Pagina successiva"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setPage(totalPages, { history: "push" })}
              disabled={page === totalPages}
              title="Ultima pagina"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
