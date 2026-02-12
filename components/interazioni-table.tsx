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
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import EliminaInterazioneModal from "@/components/elimina-interazione-modal";
import ModificaInterazioneModal from "@/components/modifica-interazione-modal";

import Link from "next/link";

type InterazioneRow = {
  id: number;
  ore: number;
  minuti: number;
  note: string | null;
  created_at: string;
  user: { id: string; name: string };
  mezzi: { id: number; nome: string } | null;
  cantieri: { id: number; nome: string };
  attivita: { id: number; date: string; external_id: string };
  user_interazione_created_byTouser: { id: string; name: string };
};

type InterazioniTableProps = {
  interazioni: InterazioneRow[];
  users: Array<{ id: string; name: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  cantieri: Array<{ id: number; nome: string }>;
  attivita: Array<{ id: number; date: string }>;
  onSuccess?: () => void;
};

const PAGE_SIZE = 10;

function InterazioniFilterDrawer({
  drawerId,
  filterUser,
  setFilterUser,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  filterMezzo,
  setFilterMezzo,
  users,
  mezzi,
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
  filterMezzo: string;
  setFilterMezzo: (val: string | null, options?: { history: "push" }) => void;
  users: { id: string; name: string }[];
  mezzi: { id: number; nome: string }[];
  setPage: (val: number, options?: { history: "push" }) => void;
}) {
  return (
    <div className="drawer-side z-50">
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
      <div className="menu p-4 w-80 min-h-full bg-base-100 text-black">
        <h2 className="text-lg font-bold mb-4">Filtra interazioni</h2>

        {/* Filtro Utente */}
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

        {/* Filtro Mezzo */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Mezzo</h3>
          <div className="max-h-60 overflow-y-auto">
            <div className="form-control mb-2">
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="mezzo-filter"
                  className="radio radio-sm"
                  checked={filterMezzo === "all"}
                  onChange={() => {
                    setFilterMezzo("all", { history: "push" });
                    setPage(1, { history: "push" });
                  }}
                />
                <span className="label-text">Tutti i mezzi</span>
              </label>
            </div>
            <div className="form-control mb-2">
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="mezzo-filter"
                  className="radio radio-sm"
                  checked={filterMezzo === "none"}
                  onChange={() => {
                    setFilterMezzo("none", { history: "push" });
                    setPage(1, { history: "push" });
                  }}
                />
                <span className="label-text">Nessun mezzo</span>
              </label>
            </div>
            {mezzi.map((mezzo) => (
              <div key={mezzo.id} className="form-control mb-2">
                <label className="label cursor-pointer">
                  <input
                    type="radio"
                    name="mezzo-filter"
                    className="radio radio-sm"
                    checked={filterMezzo === mezzo.id.toString()}
                    onChange={() => {
                      setFilterMezzo(mezzo.id.toString(), { history: "push" });
                      setPage(1, { history: "push" });
                    }}
                  />
                  <span className="label-text">{mezzo.nome}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Filtro Data */}
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
  column: "user" | "mezzi" | "attivita" | "tempo";
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (col: "user" | "mezzi" | "attivita" | "tempo") => void;
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

export default function InterazioniTable({
  interazioni,
  users,
  mezzi,
  cantieri,
  attivita,
  onSuccess,
}: InterazioniTableProps) {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [inputValue, setInputValue] = useState(search);
  const [debouncedValue] = useDebounceValue(inputValue, 400);
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
    parseAsStringLiteral(["user", "mezzi", "attivita", "tempo"]).withDefault(
      "attivita",
    ),
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
  const [filterMezzo, setFilterMezzo] = useQueryState(
    "filterMezzo",
    parseAsString.withDefault("all"),
  );
  const drawerId = "interazioni-filter-drawer";

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterUser !== "all") count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    if (filterMezzo !== "all") count++;
    return count;
  }, [filterUser, filterDateFrom, filterDateTo, filterMezzo]);

  const handleSort = (col: "user" | "mezzi" | "attivita" | "tempo") => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc", { history: "push" });
    } else {
      setSortBy(col, { history: "push" });
      setSortDir("asc", { history: "push" });
    }
    setPage(1, { history: "push" }); // Reset to first page when sorting changes
  };

  const filtered = useMemo(() => {
    let arr = interazioni;

    // Filter by user
    if (filterUser !== "all") {
      arr = arr.filter((i) => i.user.id === filterUser);
    }

    // Filter by mezzo
    if (filterMezzo !== "all") {
      if (filterMezzo === "none") {
        arr = arr.filter((i) => !i.mezzi);
      } else {
        arr = arr.filter((i) => i.mezzi?.id.toString() === filterMezzo);
      }
    }

    // Filter by date range
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      arr = arr.filter((i) => new Date(i.attivita.date) >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      arr = arr.filter((i) => new Date(i.attivita.date) <= toDate);
    }

    // Filter by search text
    if (debouncedValue) {
      const s = debouncedValue.toLowerCase();
      arr = arr.filter(
        (i) =>
          i.user.name.toLowerCase().includes(s) ||
          (i.mezzi?.nome.toLowerCase().includes(s) ?? false) ||
          i.user_interazione_created_byTouser.name.toLowerCase().includes(s),
      );
    }

    return arr;
  }, [
    debouncedValue,
    interazioni,
    filterUser,
    filterDateFrom,
    filterDateTo,
    filterMezzo,
  ]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let vA: string | number = "";
      let vB: string | number = "";

      if (sortBy === "user") {
        vA = a.user.name.toLowerCase();
        vB = b.user.name.toLowerCase();
      } else if (sortBy === "mezzi") {
        vA = (a.mezzi?.nome || "Nessuno").toLowerCase();
        vB = (b.mezzi?.nome || "Nessuno").toLowerCase();
      } else if (sortBy === "attivita") {
        vA = new Date(a.attivita.date).toISOString();
        vB = new Date(b.attivita.date).toISOString();
      } else if (sortBy === "tempo") {
        vA = a.ore * 60 + a.minuti;
        vB = b.ore * 60 + b.minuti;
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

  const formatTime = (ore: number, minuti: number) => {
    return `${ore}h ${minuti}m`;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="grow">
          <div className="join w-full max-w-md">
            <input
              type="text"
              placeholder="Cerca per utente, mezzo o creatore"
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
            <thead>
              <tr>
                <SortHeader
                  label="Utente"
                  column="user"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Mezzo"
                  column="mezzi"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Attività"
                  column="attivita"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Tempo"
                  column="tempo"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th>Note</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-base-content/60 py-8"
                  >
                    Nessuna interazione trovata.
                  </td>
                </tr>
              ) : (
                paginated.map((i) => (
                  <tr key={i.id}>
                    <td>{i.user.name}</td>
                    <td>{i.mezzi?.nome || "Nessuno"}</td>
                    <td>
                      <Link
                        href={`/admin/attivita/${i.attivita.id}`}
                        className="block link"
                      >
                        {new Date(i.attivita.date).toLocaleDateString("it-IT")}
                      </Link>
                    </td>
                    <td>{formatTime(i.ore, i.minuti)}</td>
                    <td className="max-w-xs truncate">{i.note || ""}</td>
                    <td>
                      <div className="flex gap-2">
                        <ModificaInterazioneModal
                          interazione={i}
                          mezzi={mezzi}
                          cantieri={cantieri}
                          attivita={attivita}
                          onSuccess={onSuccess}
                        />
                        <EliminaInterazioneModal
                          interazione={i}
                          onSuccess={onSuccess}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <InterazioniFilterDrawer
          drawerId={drawerId}
          filterUser={filterUser}
          setFilterUser={setFilterUser}
          filterDateFrom={filterDateFrom}
          setFilterDateFrom={setFilterDateFrom}
          filterDateTo={filterDateTo}
          setFilterDateTo={setFilterDateTo}
          filterMezzo={filterMezzo}
          setFilterMezzo={setFilterMezzo}
          users={users}
          mezzi={mezzi}
          setPage={setPage}
        />
      </div>

      {/* Paginazione */}
      {pageCount > 1 ? (
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
      ) : null}
    </div>
  );
}
