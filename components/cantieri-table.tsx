"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronUp,
  Pencil,
  Search,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import ModificaCantiereModal from "@/components/modifica-cantiere-modal";
import { fetcher } from "@/lib/api-fetcher";

interface Cantiere {
  id: number;
  nome: string;
  descrizione: string;
  open: boolean;
  external_id: string;
  totalInterazioni: number;
  totalMilliseconds: number;
  user_cantieri_created_byTouser?: { id: string; name: string };
}

interface CantieriResponse {
  cantieri: Cantiere[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function CantieriFilterDrawer({
  drawerId,
  filterStatus,
  setFilterStatus,
  setPage,
}: {
  drawerId: string;
  filterStatus: string;
  setFilterStatus: (val: string | null, options?: { history: "push" }) => void;
  setPage: (val: number, options?: { history: "push" }) => void;
}) {
  return (
    <div className="drawer-side">
      <button
        type="button"
        className="drawer-overlay"
        onClick={() => {
          const checkbox = document.getElementById(drawerId) as HTMLInputElement;
          if (checkbox) checkbox.checked = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            const checkbox = document.getElementById(drawerId) as HTMLInputElement;
            if (checkbox) checkbox.checked = false;
          }
        }}
        aria-label="Chiudi filtro"
      />
      <div className="menu p-4 w-80 min-h-full bg-base-100">
        <h2 className="text-lg font-bold mb-4">Filtra cantieri</h2>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Stato Cantiere</h3>
          <div className="form-control mb-2">
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="status-filter"
                className="radio radio-sm"
                checked={filterStatus === "all"}
                onChange={() => {
                  setFilterStatus("all", { history: "push" });
                  setPage(1, { history: "push" });
                }}
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
                onChange={() => {
                  setFilterStatus("open", { history: "push" });
                  setPage(1, { history: "push" });
                }}
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
                onChange={() => {
                  setFilterStatus("closed", { history: "push" });
                  setPage(1, { history: "push" });
                }}
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

const SEARCH_DEBOUNCE_MS = 400;

export default function CantieriTable() {
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [inputValue, setInputValue] = useState(search);
  const [debouncedValue] = useDebounceValue(inputValue, SEARCH_DEBOUNCE_MS);
  const lastSearchFromDebounceRef = useRef(search);

  useEffect(() => {
    if (debouncedValue !== search) {
      lastSearchFromDebounceRef.current = debouncedValue;
      setSearch(debouncedValue, { history: "push" });
      if (page > 1) setPage(1, { history: "push" });
    }
  }, [debouncedValue, search, setSearch, setPage, page]);

  useEffect(() => {
    if (search !== lastSearchFromDebounceRef.current) {
      lastSearchFromDebounceRef.current = search;
      setInputValue(search);
    }
  }, [search]);

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

  const openParam =
    filterStatus === "open" ? "true" : filterStatus === "closed" ? "false" : "";
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    if (search) params.set("search", search);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortDir);
    if (openParam) params.set("open", openParam);
    return `/api/cantieri?${params.toString()}`;
  }, [page, search, sortBy, sortDir, openParam]);

  const { data, error, isLoading, mutate } = useSWR<CantieriResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

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
    setPage(1, { history: "push" });
  };

  const cantieri = data?.cantieri ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="grow">
          <div className="join w-full max-w-md">
            <input
              type="text"
              placeholder="Cerca per nome o descrizione"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <span className="loading loading-spinner loading-lg" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-error">
                    Errore nel caricamento dei dati
                  </td>
                </tr>
              ) : cantieri.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-base-content/60 py-8"
                  >
                    Nessun cantiere trovato.
                  </td>
                </tr>
              ) : (
                cantieri.map((c) => (
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
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => setSelectedCantiereForEdit(c)}
                          aria-label={`Modifica ${c.nome}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/admin/cantieri/${c.id}`}
                          className="btn btn-sm btn-ghost"
                          aria-label={`Dettaglio ${c.nome}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
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
          setPage={setPage}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-base-content/70">
            Pagina {page} di {totalPages} ({total} cantieri totali)
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
              onClick={() => setPage(Math.max(1, page - 1), { history: "push" })}
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
          onSuccess={() => mutate()}
        />
      )}
    </div>
  );
}
