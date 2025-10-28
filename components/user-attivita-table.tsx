"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";
import type { UserAttivita } from "@/lib/data/user-attivita.data";

type UserAttivitaTableProps = {
  attivita: UserAttivita[];
};

const PAGE_SIZE = 10;

export default function UserAttivitaTable({
  attivita,
}: UserAttivitaTableProps) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const pageCount = Math.ceil(attivita.length / PAGE_SIZE);
  const paginated = useMemo(
    () => attivita.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, attivita],
  );

  const handlePage = (newPage: number) => {
    setPage(newPage, { history: "push" });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-sm text-base-content/70">
        Visualizza le tue attività inserite negli ultimi 7 giorni
      </p>
      <div className="overflow-x-auto rounded-lg shadow mt-2">
        <table className="table w-full">
          <thead className="bg-base-200">
            <tr>
              <th>Data</th>
              <th className="hidden md:table-cell"># Cantieri</th>
              <th className="hidden md:table-cell"># Mezzi</th>
              <th>Totale ore</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-base-content/60 py-8"
                >
                  Nessuna attività trovata negli ultimi 7 giorni.
                </td>
              </tr>
            ) : (
              paginated.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.date).toLocaleDateString("it-IT")}</td>
                  <td className="hidden md:table-cell">{a.cantieriCount}</td>
                  <td className="hidden md:table-cell">{a.mezziCount}</td>
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
                      href={`/dashboard/attivita/${a.external_id}`}
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

      {/* Pagination */}
      {pageCount > 1 && (
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
      )}
    </div>
  );
}
