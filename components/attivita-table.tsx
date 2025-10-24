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
import EliminaAttivitaModal from "@/components/elimina-attivita-modal";
import ModificaAttivitaModal from "@/components/modifica-attivita-modal";
import type { Attivita } from "@/lib/data/attivita.data";
import type { UserNotBanned } from "@/lib/data/users.data";

type AttivitaTableProps = {
  attivita: Attivita[];
  users: UserNotBanned[];
};

const PAGE_SIZE = 10;

function AttivitaFilterDrawer({
  drawerId,
  filterUser,
  setFilterUser,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
  users,
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
        <h2 className="text-lg font-bold mb-4">Filtra attività</h2>

        {/* Filtro Utente */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Utente</h3>
          <div className="form-control mb-2">
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="user-filter"
                className="radio radio-sm"
                checked={filterUser === "all"}
                onChange={() => setFilterUser("all", { history: "push" })}
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
                  onChange={() => setFilterUser(user.id, { history: "push" })}
                />
                <span className="label-text">{user.name}</span>
              </label>
            </div>
          ))}
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
              onChange={(e) =>
                setFilterDateFrom(e.target.value || null, { history: "push" })
              }
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
              onChange={(e) =>
                setFilterDateTo(e.target.value || null, { history: "push" })
              }
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
  column: "date" | "user" | "totalMilliseconds";
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (col: "date" | "user" | "totalMilliseconds") => void;
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

export default function AttivitaTable({ attivita, users }: AttivitaTableProps) {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringLiteral(["date", "user", "totalMilliseconds"]).withDefault(
      "date",
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
  const [selectedAttivitaForEdit, setSelectedAttivitaForEdit] =
    useState<Attivita | null>(null);
  const [selectedAttivitaForDelete, setSelectedAttivitaForDelete] =
    useState<Attivita | null>(null);
  const drawerId = "attivita-filter-drawer";

  // Use users from props for filter

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterUser !== "all") count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [filterUser, filterDateFrom, filterDateTo]);

  const handleSort = (col: "date" | "user" | "totalMilliseconds") => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc", { history: "push" });
    } else {
      setSortBy(col, { history: "push" });
      setSortDir("asc", { history: "push" });
    }
    setPage(1, { history: "push" }); // Reset to first page when sorting changes
  };

  const filtered = useMemo(() => {
    let arr = attivita;

    // Filter by user
    if (filterUser !== "all") {
      arr = arr.filter((a) => a.user.id === filterUser);
    }

    // Filter by date range
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      arr = arr.filter((a) => new Date(a.date) >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      arr = arr.filter((a) => new Date(a.date) <= toDate);
    }

    // Filter by search text
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(
        (a) =>
          a.user.name.toLowerCase().includes(s) ||
          new Date(a.date).toLocaleDateString("it-IT").includes(s),
      );
    }

    return arr;
  }, [search, attivita, filterUser, filterDateFrom, filterDateTo]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let vA: string = "";
      let vB: string = "";
      if (sortBy === "date") {
        vA = new Date(a.date).toISOString();
        vB = new Date(b.date).toISOString();
      } else if (sortBy === "user") {
        vA = a.user.name.toLowerCase();
        vB = b.user.name.toLowerCase();
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
              placeholder="Cerca per utente o data"
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
                <th># Cantieri</th>
                <th># Mezzi</th>
                <SortHeader
                  label="Totale ore"
                  column="totalMilliseconds"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center text-base-content/60 py-8"
                  >
                    Nessuna attività trovata.
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.date).toLocaleDateString("it-IT")}</td>
                    <td>{a.user.name}</td>
                    <td>{a.cantieriCount}</td>
                    <td>{a.mezziCount}</td>
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
                        href={`/attivita/${a.external_id}`}
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
        <AttivitaFilterDrawer
          drawerId={drawerId}
          filterUser={filterUser}
          setFilterUser={setFilterUser}
          filterDateFrom={filterDateFrom}
          setFilterDateFrom={setFilterDateFrom}
          filterDateTo={filterDateTo}
          setFilterDateTo={setFilterDateTo}
          users={users}
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

      {selectedAttivitaForEdit && (
        <ModificaAttivitaModal
          attivita={{
            id: selectedAttivitaForEdit.id,
            date: new Date(selectedAttivitaForEdit.date)
              .toISOString()
              .split("T")[0],
            user_id: selectedAttivitaForEdit.user_id,
          }}
          onClose={() => setSelectedAttivitaForEdit(null)}
        />
      )}
      {selectedAttivitaForDelete && (
        <EliminaAttivitaModal
          attivita={{
            id: selectedAttivitaForDelete.id,
            date: selectedAttivitaForDelete.date.toString(),
            user: selectedAttivitaForDelete.user.name,
          }}
          onClose={() => setSelectedAttivitaForDelete(null)}
        />
      )}
    </div>
  );
}
