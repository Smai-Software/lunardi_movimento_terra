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
import useSWR from "swr";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import EliminaAttivitaModal from "@/components/elimina-attivita-modal";
import ModificaAttivitaModal from "@/components/modifica-attivita-modal";
import { fetcher } from "@/lib/api-fetcher";

interface AttivitaItem {
  id: number;
  date: string;
  user_id: string;
  external_id: string;
  is_checked: boolean;
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

interface UsersResponse {
  users: { id: string; name: string }[];
  total: number;
}

function AttivitaFilterDrawer({
  drawerId,
  filterUser,
  setFilterUser,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  users,
  setPage,
}: {
  drawerId: string;
  filterUser: string;
  setFilterUser: (val: string | null, options?: { history: "push" }) => void;
  filterDateFrom: string;
  setFilterDateFrom: (
    val: string | null,
    options?: { history: "push" },
  ) => void;
  filterDateTo: string;
  setFilterDateTo: (val: string | null, options?: { history: "push" }) => void;
  users: { id: string; name: string }[];
  setPage: (val: number, options?: { history: "push" }) => void;
}) {
  return (
    <div className="drawer-side z-50">
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
      <div className="menu p-4 w-80 min-h-full bg-base-100 text-black">
        <h2 className="text-lg font-bold mb-4">Filtra attività</h2>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Utente</h3>
          <div className="max-h-60 overflow-y-auto">
            <div className="form-control mb-2">
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="user-filter"
                  className="radio radio-sm"
                  checked={filterUser === "all"}
                  onChange={() => {
                    setFilterUser("all", { history: "push" });
                    setPage(1, { history: "push" });
                  }}
                />
                <span className="label-text">Tutti gli utenti</span>
              </label>
            </div>
            {users.map((user) => (
              <div key={user.id} className="form-control mb-2">
                <label className="label cursor-pointer">
                  <input
                    type="radio"
                    name="user-filter"
                    className="radio radio-sm"
                    checked={filterUser === user.id}
                    onChange={() => {
                      setFilterUser(user.id, { history: "push" });
                      setPage(1, { history: "push" });
                    }}
                  />
                  <span className="label-text">{user.name}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Periodo</h3>
          <div className="form-control mb-2">
            <label className="label" htmlFor="date-from">
              <span className="label-text">Da</span>
            </label>
            <input
              id="date-from"
              type="date"
              className="input input-bordered input-sm"
              value={filterDateFrom}
              onChange={(e) => {
                setFilterDateFrom(e.target.value || null, { history: "push" });
                setPage(1, { history: "push" });
              }}
            />
          </div>
          <div className="form-control mb-2">
            <label className="label" htmlFor="date-to">
              <span className="label-text">A</span>
            </label>
            <input
              id="date-to"
              type="date"
              className="input input-bordered input-sm"
              value={filterDateTo}
              onChange={(e) => {
                setFilterDateTo(e.target.value || null, { history: "push" });
                setPage(1, { history: "push" });
              }}
            />
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
  column: "date" | "user";
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (col: "date" | "user") => void;
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

export default function AttivitaTable() {
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
    parseAsStringLiteral(["date", "user"]).withDefault("date"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringLiteral(["asc", "desc"]).withDefault("desc"),
  );
  const [filterUser, setFilterUser] = useQueryState(
    "filterUser",
    parseAsString.withDefault("all"),
  );
  const [filterDateFrom, setFilterDateFrom] = useQueryState(
    "filterDateFrom",
    parseAsString.withDefault(""),
  );
  const [filterDateTo, setFilterDateTo] = useQueryState(
    "filterDateTo",
    parseAsString.withDefault(""),
  );
  const [selectedAttivitaForEdit, setSelectedAttivitaForEdit] =
    useState<AttivitaItem | null>(null);
  const [selectedAttivitaForDelete, setSelectedAttivitaForDelete] =
    useState<AttivitaItem | null>(null);
  const drawerId = "attivita-filter-drawer";

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    if (search) params.set("search", search);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortDir);
    if (filterUser !== "all") params.set("userId", filterUser);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);
    return `/api/attivita?${params.toString()}`;
  }, [
    page,
    search,
    sortBy,
    sortDir,
    filterUser,
    filterDateFrom,
    filterDateTo,
  ]);

  const { data, error, isLoading } = useSWR<AttivitaResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const { data: usersData } = useSWR<UsersResponse>(
    "/api/users?notBanned=true&limit=1000",
    fetcher,
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterUser !== "all") count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [filterUser, filterDateFrom, filterDateTo]);

  const handleSort = (col: "date" | "user") => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc", { history: "push" });
    } else {
      setSortBy(col, { history: "push" });
      setSortDir("asc", { history: "push" });
    }
    setPage(1, { history: "push" });
  };

  const attivita = data?.attivita ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;
  const users = usersData?.users ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="grow">
          <div className="join w-full max-w-md">
            <input
              type="text"
              placeholder="Cerca per utente o data"
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
          {activeFilterCount > 0 ? (
            <span className="badge badge-secondary badge-sm absolute -top-2 -right-2">
              {activeFilterCount}
            </span>
          ) : null}
        </label>
      </div>

      <div className="drawer drawer-end z-50">
        <input id={drawerId} type="checkbox" className="drawer-toggle" />
        <div className="overflow-x-auto rounded-lg shadow content-visibility-auto">
          <table className="table w-full">
            <thead className="bg-base-200">
              <tr>
                <th className="w-8" title="Registrata">
                  ✓
                </th>
                <SortHeader
                  label="Data"
                  column="date"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Utente"
                  column="user"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th># Interazioni</th>
                <th># Trasporti</th>
                <th># Assenze</th>
                <th>Totale ore</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <span className="loading loading-spinner loading-lg" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-error">
                    Errore nel caricamento dei dati
                  </td>
                </tr>
              ) : attivita.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-base-content/60 py-8"
                  >
                    Nessuna attività trovata.
                  </td>
                </tr>
              ) : (
                attivita.map((a) => (
                  <tr key={a.id}>
                    <td className="align-middle">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          a.is_checked ? "bg-green-500" : "bg-orange-500"
                        }`}
                        title={a.is_checked ? "Registrata" : "Non registrata"}
                        aria-hidden
                      />
                    </td>
                    <td>
                      {new Date(a.date).toLocaleDateString("it-IT")}
                    </td>
                    <td>{a.user.name}</td>
                    <td>{a.interazioniCount}</td>
                    <td>{a.trasportiCount}</td>
                    <td>{a.assenzeCount}</td>
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
                        href={`/admin/attivita/${a.id}`}
                        className="btn btn-sm btn-ghost"
                        aria-label={`Dettaglio attività ${a.id}`}
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
        <AttivitaFilterDrawer
          drawerId={drawerId}
          filterUser={filterUser}
          setFilterUser={setFilterUser}
          filterDateFrom={filterDateFrom}
          setFilterDateFrom={setFilterDateFrom}
          filterDateTo={filterDateTo}
          setFilterDateTo={setFilterDateTo}
          users={users}
          setPage={setPage}
        />
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-base-content/70">
            Pagina {page} di {totalPages} ({total} attività totali)
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
      ) : null}

      {selectedAttivitaForEdit ? (
        <ModificaAttivitaModal
          attivita={{
            id: selectedAttivitaForEdit.id,
            date: new Date(selectedAttivitaForEdit.date)
              .toISOString()
              .split("T")[0],
            user_id: selectedAttivitaForEdit.user_id,
          }}
        />
      ) : null}
      {selectedAttivitaForDelete ? (
        <EliminaAttivitaModal
          attivita={{
            id: selectedAttivitaForDelete.id,
            date: selectedAttivitaForDelete.date.toString(),
            user: selectedAttivitaForDelete.user.name,
          }}
        />
      ) : null}
    </div>
  );
}
