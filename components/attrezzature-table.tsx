"use client";

import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import EliminaAttrezzaturaModal from "@/components/elimina-attrezzatura-modal";
import ModificaAttrezzaturaModal from "@/components/modifica-attrezzatura-modal";
import { fetcher } from "@/lib/api-fetcher";
import useSWR from "swr";

interface Attrezzatura {
  id: number;
  nome: string;
}

interface AttrezzatureResponse {
  attrezzature: Attrezzatura[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SEARCH_DEBOUNCE_MS = 400;

export default function AttrezzatureTable() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
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

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (search) params.set("search", search);
    return `/api/attrezzature?${params.toString()}`;
  }, [page, search]);

  const { data, error, isLoading, mutate } = useSWR<AttrezzatureResponse>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true },
  );

  const attrezzature = data?.attrezzature ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="grow">
          <input
            type="text"
            placeholder="Cerca per nome"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="input input-bordered w-full max-w-md"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow content-visibility-auto">
        <table className="table">
          <thead className="bg-base-200">
            <tr>
              <th>Nome</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={2} className="text-center py-8">
                  <span className="loading loading-spinner loading-lg" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={2} className="text-center py-8 text-error">
                  Errore nel caricamento dei dati
                </td>
              </tr>
            ) : attrezzature.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="text-center text-base-content/60 py-8"
                >
                  Nessuna attrezzatura trovata.
                </td>
              </tr>
            ) : (
              attrezzature.map((att) => (
                <tr key={att.id}>
                  <td>{att.nome}</td>
                  <td>
                    <div className="flex gap-2">
                      <ModificaAttrezzaturaModal
                        attrezzatura={{ id: att.id, nome: att.nome }}
                        onSuccess={() => mutate()}
                      />
                      <EliminaAttrezzaturaModal
                        attrezzatura={{ id: att.id, nome: att.nome }}
                        onSuccess={() => mutate()}
                      />
                    </div>
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
            Pagina {page} di {totalPages} ({total} attrezzature totali)
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              «
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ‹
            </button>
            <button
              type="button"
              className="btn btn-sm btn-active"
              disabled
            >
              {page}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              ›
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              »
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
