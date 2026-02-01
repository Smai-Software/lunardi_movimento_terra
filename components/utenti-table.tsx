"use client";

import { CheckIcon, XIcon } from "lucide-react";
import useSWR from "swr";
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import ModificaUtenteModal from "@/components/modifica-utente-modal";
import BanUserDialog from "@/components/ban-user-dialog";
import { fetcher } from "@/lib/api-fetcher";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  licenseCamion: boolean | null;
  licenseEscavatore: boolean | null;
  banned: boolean | null;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UtentiTable({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
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

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (search) params.set("search", search);
    return `/api/users?${params.toString()}`;
  }, [page, search]);

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true },
  );

  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Cerca per nome o email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="input input-bordered w-full max-w-md"
        />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table">
          <thead className="bg-base-200">
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Patente Camion</th>
              <th>Patente Escavatore</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  <span className="loading loading-spinner loading-lg" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-error">
                  Errore nel caricamento dei dati
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-base-content/60 py-8"
                >
                  Nessun utente trovato.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isCurrentUser = currentUserId === user.id;
                const isBanned = Boolean(user.banned);

                return (
                  <tr key={user.id}>
                    <td>{user.name ?? ""}</td>
                    <td>{user.email}</td>
                    <td>{user.phone ?? ""}</td>
                    <td>
                      {user.licenseCamion ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <XIcon className="w-4 h-4" />
                      )}
                    </td>
                    <td>
                      {user.licenseEscavatore ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <XIcon className="w-4 h-4" />
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${isBanned ? "badge-error" : "badge-success"}`}
                      >
                        {isBanned ? "Bloccato" : "Attivo"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <ModificaUtenteModal
                          utente={{
                            id: user.id,
                            name: user.name,
                            phone: user.phone,
                            licenseCamion: user.licenseCamion,
                            licenseEscavatore: user.licenseEscavatore,
                          }}
                          onSuccess={() => mutate()}
                        />
                        {!isCurrentUser && (
                          <BanUserDialog
                            user={{
                              id: user.id,
                              name: user.name,
                              banned: user.banned,
                            }}
                            onSuccess={() => mutate()}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-base-content/70">
            Pagina {page} di {totalPages} ({total} utenti totali)
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
            <span className="btn btn-sm btn-active">{page}</span>
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
      )}
    </div>
  );
}
