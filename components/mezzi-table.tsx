"use client";

import { CheckIcon, XIcon } from "lucide-react";
import useSWR from "swr";
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import { useMemo } from "react";
import AggiungiMezzoModal from "@/components/aggiungi-mezzo-modal";
import AssegnaUtenteMezzoModal from "@/components/assegna-utente-mezzo-modal";
import EliminaMezzoModal from "@/components/elimina-mezzo-modal";
import ModificaMezzoModal from "@/components/modifica-mezzo-modal";
import { fetcher } from "@/lib/api-fetcher";

interface Mezzo {
  id: number;
  nome: string;
  descrizione: string;
  has_license_camion: boolean;
  has_license_escavatore: boolean;
  user_mezzi?: { user_id: string; user?: { id: string; name: string } }[];
}

interface MezziResponse {
  mezzi: Mezzo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UsersResponse {
  users: { id: string; name: string }[];
  total: number;
}

export default function MezziTable() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ throttleMs: 300 }),
  );

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (search) params.set("search", search);
    return `/api/mezzi?${params.toString()}`;
  }, [page, search]);

  const { data, error, isLoading, mutate } = useSWR<MezziResponse>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true },
  );

  const { data: usersData } = useSWR<UsersResponse>(
    "/api/users?notBanned=true&limit=1000",
    fetcher,
  );

  const mezzi = data?.mezzi ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;
  const users = usersData?.users ?? [];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (page > 1) setPage(1);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="grow">
          <input
            type="text"
            placeholder="Cerca per nome o descrizione"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input input-bordered w-full max-w-md"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table">
          <thead className="bg-base-200">
            <tr>
              <th>Nome</th>
              <th>Descrizione</th>
              <th>Patente Camion</th>
              <th>Patente Escavatore</th>
              <th>N. Operatori</th>
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
            ) : mezzi.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-base-content/60 py-8"
                >
                  Nessun mezzo trovato.
                </td>
              </tr>
            ) : (
              mezzi.map((mezzo) => (
                <tr key={mezzo.id}>
                  <td>{mezzo.nome}</td>
                  <td>{mezzo.descrizione}</td>
                  <td>
                    {mezzo.has_license_camion ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <XIcon className="w-4 h-4" />
                    )}
                  </td>
                  <td>
                    {mezzo.has_license_escavatore ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <XIcon className="w-4 h-4" />
                    )}
                  </td>
                  <td>
                    <span className="font-medium">
                      {mezzo.user_mezzi?.length ?? 0}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <AssegnaUtenteMezzoModal
                        mezzoId={mezzo.id}
                        mezzoNome={mezzo.nome}
                        mezzoLicenze={{
                          has_license_camion: mezzo.has_license_camion,
                          has_license_escavatore: mezzo.has_license_escavatore,
                        }}
                        users={users}
                        userMezzi={(mezzo.user_mezzi ?? []).map((u) => ({
                          user_id: u.user_id,
                          mezzi_id: mezzo.id,
                        }))}
                        onSuccess={() => mutate()}
                      />
                      <ModificaMezzoModal
                        mezzo={{
                          id: mezzo.id,
                          nome: mezzo.nome,
                          descrizione: mezzo.descrizione,
                          has_license_camion: mezzo.has_license_camion,
                          has_license_escavatore: mezzo.has_license_escavatore,
                        }}
                        onSuccess={() => mutate()}
                      />
                      <EliminaMezzoModal
                        mezzo={{ id: mezzo.id, nome: mezzo.nome }}
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

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-base-content/70">
            Pagina {page} di {totalPages} ({total} mezzi totali)
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
      )}
    </div>
  );
}
