"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronUp,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useMemo, useState } from "react";
import ModificaCantiereModal from "@/components/modifica-cantiere-modal";

import type { Cantiere } from "@/lib/data/cantieri.data";

type CantieriTableProps = {
  cantieri: Cantiere[];
};

const PAGE_SIZE = 10;

function CantieriFilterDrawer({
  drawerId,
  filterStatus,
  setFilterStatus,
}: {
  drawerId: string;
  filterStatus: string;
  setFilterStatus: (val: string | null, options?: { history: "push" }) => void;
}) {
  return (
    <div className="drawer-side">
      <button
        type="button"
        className="drawer-overlay"
        onClick={() => {
          const checkbox = document.getElementById(
            drawerId,
          ) as HTMLInputElement;
          if (checkbox) checkbox.checked = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            const checkbox = document.getElementById(
              drawerId,
            ) as HTMLInputElement;
            if (checkbox) checkbox.checked = false;
          }
        }}
        aria-label="Chiudi filtro"
      ></button>
      <div className="menu p-4 w-80 min-h-full bg-base-100">
        <h2 className="text-lg font-bold mb-4">Filtra cantieri</h2>

        {/* Filtro Stato Cantiere */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Stato Cantiere</h3>
          <div className="form-control mb-2">
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="status-filter"
                className="radio radio-sm"
                checked={filterStatus === "all"}
                onChange={() => setFilterStatus("all", { history: "push" })}
              />
              <span className="label-text">Tutti gli stati</span>
            </label>
          </div>
          <div className="form-control mb-2">
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="status-filter"
                className="radio radio-sm"
                checked={filterStatus === "open"}
                onChange={() => setFilterStatus("open", { history: "push" })}
              />
              <span className="label-text">Aperti</span>
            </label>
          </div>
          <div className="form-control mb-2">
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="status-filter"
                className="radio radio-sm"
                checked={filterStatus === "closed"}
                onChange={() => setFilterStatus("closed", { history: "push" })}
              />
              <span className="label-text">Chiusi</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  column:
    | "nome"
    | "descrizione"
    | "open"
    | "totalInterazioni"
    | "totalMilliseconds";
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (
    col:
      | "nome"
      | "descrizione"
      | "open"
      | "totalInterazioni"
      | "totalMilliseconds",
  ) => void;
}) {
  return (
    <th className="cursor-pointer select-none" onClick={() => onSort(column)}>
      <span className="flex items-center gap-1">
        {label}{" "}
        {sortBy === column ? (
          sortDir === "asc" ? (
            <ChevronUp />
          ) : (
            <ChevronDown />
          )
        ) : (
          <ChevronsUpDown />
        )}
      </span>
    </th>
  );
}

export default function CantieriTable({ cantieri }: CantieriTableProps) {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringLiteral([
      "nome",
      "descrizione",
      "open",
      "totalInterazioni",
      "totalMilliseconds",
    ]).withDefault("nome"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringLiteral(["asc", "desc"]).withDefault("asc"),
  );
  const [filterStatus, setFilterStatus] = useQueryState(
    "filterStatus",
    parseAsString.withDefault("all"),
  );
  const [selectedCantiereForEdit, setSelectedCantiereForEdit] =
    useState<Cantiere | null>(null);
  const drawerId = "cantieri-filter-drawer";

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterStatus !== "all") count++;
    return count;
  }, [filterStatus]);

  const handleSort = (
    col:
      | "nome"
      | "descrizione"
      | "open"
      | "totalInterazioni"
      | "totalMilliseconds",
  ) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc", { history: "push" });
    } else {
      setSortBy(col, { history: "push" });
      setSortDir("asc", { history: "push" });
    }
    setPage(1, { history: "push" }); // Reset to first page when sorting changes
  };

  const filtered = useMemo(() => {
    let arr = cantieri;

    // Filter by status
    if (filterStatus !== "all") {
      if (filterStatus === "open") {
        arr = arr.filter((c) => c.open === true);
      } else if (filterStatus === "closed") {
        arr = arr.filter((c) => c.open === false);
      }
    }

    // Filter by search text
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(
        (c) =>
          c.nome.toLowerCase().includes(s) ||
          c.descrizione.toLowerCase().includes(s) ||
          c.user_cantieri_created_byTouser.name.toLowerCase().includes(s),
      );
    }

    return arr;
  }, [search, cantieri, filterStatus]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let vA: string = "";
      let vB: string = "";
      if (sortBy === "nome") {
        vA = a.nome.toLowerCase();
        vB = b.nome.toLowerCase();
      } else if (sortBy === "descrizione") {
        vA = a.descrizione.toLowerCase();
        vB = b.descrizione.toLowerCase();
      } else if (sortBy === "open") {
        vA = a.open ? "aperto" : "chiuso";
        vB = b.open ? "aperto" : "chiuso";
      } else if (sortBy === "totalInterazioni") {
        vA = a.totalInterazioni.toString();
        vB = b.totalInterazioni.toString();
      } else if (sortBy === "totalMilliseconds") {
        vA = a.totalMilliseconds.toString();
        vB = b.totalMilliseconds.toString();
      }
      if (vA < vB) return sortDir === "asc" ? -1 : 1;
      if (vA > vB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, sorted],
  );

  const handlePage = (newPage: number) => {
    setPage(newPage, { history: "push" });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="grow">
          <div className="join w-full max-w-md">
            <input
              type="text"
              placeholder="Cerca per nome o descrizione"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value, { history: "push" });
                setPage(1, { history: "push" });
              }}
              className="input input-bordered grow join-item"
            />
            <button type="button" className="btn join-item">
              <Search />
            </button>
          </div>
        </div>
        <label htmlFor={drawerId} className="btn btn-outline relative">
          Filtra
          {activeFilterCount > 0 && (
            <span className="badge badge-secondary badge-sm absolute -top-2 -right-2">
              {activeFilterCount}
            </span>
          )}
        </label>
      </div>

      <div className="drawer drawer-end z-10">
        <input id={drawerId} type="checkbox" className="drawer-toggle" />
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="table w-full">
            <thead className="bg-base-200">
              <tr>
                <SortHeader
                  label="Nome"
                  column="nome"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Descrizione"
                  column="descrizione"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Stato"
                  column="open"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Numero interazioni"
                  column="totalInterazioni"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Totale ore"
                  column="totalMilliseconds"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-base-content/60 py-8"
                  >
                    Nessun cantiere trovato.
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>{c.descrizione}</td>
                    <td>
                      {c.open ? (
                        <span className="badge badge-success">Aperto</span>
                      ) : (
                        <span className="badge badge-error">Chiuso</span>
                      )}
                    </td>
                    <td>{c.totalInterazioni}</td>
                    <td>
                      {(() => {
                        const totalMinutes = Math.floor(
                          Number(c.totalMilliseconds) / (1000 * 60),
                        );
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        return `${hours}h ${minutes}m`;
                      })()}
                    </td>
                    <td>
                      <Link
                        href={`/cantieri/${c.external_id}`}
                        className="btn btn-sm btn-ghost"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <CantieriFilterDrawer
          drawerId={drawerId}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
      </div>

      {/* Paginazione */}
      {pageCount > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-base-content/70">
            Pagina {page} di {pageCount}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => handlePage(1)}
              disabled={page === 1}
              title="Prima pagina"
            >
              <ChevronsLeft className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => handlePage(page - 1)}
              disabled={page === 1}
              title="Pagina precedente"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => handlePage(page + 1)}
              disabled={page === pageCount}
              title="Pagina successiva"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => handlePage(pageCount)}
              disabled={page === pageCount}
              title="Ultima pagina"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {selectedCantiereForEdit && (
        <ModificaCantiereModal
          cantiere={{
            id: selectedCantiereForEdit.id,
            nome: selectedCantiereForEdit.nome,
            descrizione: selectedCantiereForEdit.descrizione,
            open: selectedCantiereForEdit.open,
          }}
          onClose={() => setSelectedCantiereForEdit(null)}
        />
      )}
    </div>
  );
}
