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
import { useMemo, useState } from "react";
import EliminaInterazioneModal from "@/components/elimina-interazione-modal";
import ModificaInterazioneModal from "@/components/modifica-interazione-modal";

import type { InterazioneAll } from "@/lib/data/interazioni.data";

type InterazioniTableProps = {
  interazioni: InterazioneAll[];
  users: Array<{ id: string; name: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  attivita: Array<{ id: number; date: Date }>;
};

const PAGE_SIZE = 10;

function SortHeader({
  label,
  column,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  column: "user" | "mezzi" | "attivita" | "tempo" | "created_at";
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (col: "user" | "mezzi" | "attivita" | "tempo" | "created_at") => void;
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
  attivita,
}: InterazioniTableProps) {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringLiteral([
      "user",
      "mezzi",
      "attivita",
      "tempo",
      "created_at",
    ]).withDefault("created_at"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringLiteral(["asc", "desc"]).withDefault("desc"),
  );
  const [selectedInterazioneForEdit, setSelectedInterazioneForEdit] =
    useState<InterazioneAll | null>(null);
  const [selectedInterazioneForDelete, setSelectedInterazioneForDelete] =
    useState<InterazioneAll | null>(null);

  const handleSort = (
    col: "user" | "mezzi" | "attivita" | "tempo" | "created_at",
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
    let arr = interazioni;

    // Filter by search text
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(
        (i) =>
          i.user.name.toLowerCase().includes(s) ||
          (i.mezzi?.nome.toLowerCase().includes(s) ?? false) ||
          i.user_interazione_created_byTouser.name.toLowerCase().includes(s),
      );
    }

    return arr;
  }, [search, interazioni]);

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
      } else if (sortBy === "created_at") {
        vA = new Date(a.created_at).toISOString();
        vB = new Date(b.created_at).toISOString();
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
              placeholder="Cerca per utente o mezzo"
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
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
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
              <SortHeader
                label="Data creazione"
                column="created_at"
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
                    <span className="link link-primary cursor-pointer">
                      {new Date(i.attivita.date).toLocaleDateString("it-IT")}
                    </span>
                  </td>
                  <td>{formatTime(i.ore, i.minuti)}</td>
                  <td>{new Date(i.created_at).toLocaleDateString("it-IT")}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setSelectedInterazioneForEdit(i)}
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => setSelectedInterazioneForDelete(i)}
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

      {selectedInterazioneForEdit && (
        <ModificaInterazioneModal
          interazione={selectedInterazioneForEdit}
          users={users}
          mezzi={mezzi}
          attivita={attivita}
          onClose={() => setSelectedInterazioneForEdit(null)}
        />
      )}
      {selectedInterazioneForDelete && (
        <EliminaInterazioneModal
          interazione={selectedInterazioneForDelete}
          onClose={() => setSelectedInterazioneForDelete(null)}
        />
      )}
    </div>
  );
}
