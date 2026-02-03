"use client";

import { notFound } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { UserIcon } from "lucide-react";
import CantiereInfoCard from "@/components/cantiere-info-card";
import AssegnaUtenteCantiereModal from "@/components/assegna-utente-cantiere-modal";
import TotalHoursFromInterazioniCard from "@/components/total-hours-from-interazioni";
import TotalInterazioniCountCard from "@/components/total-interazioni-count-card";
import InterazioniTable from "@/components/interazioni-table";
import { fetcher } from "@/lib/api-fetcher";

type CantiereBySlug = {
  cantiere: {
    id: number;
    nome: string;
    descrizione: string;
    open: boolean;
    closed_at: string | null;
    external_id: string;
    created_at: string;
    last_update_at: string;
    created_by: string;
    last_update_by: string;
    user_cantieri_created_byTouser: { id: string; name: string };
    user_cantieri_last_update_byTouser: { id: string; name: string };
  };
};

type InterazioniResponse = {
  interazioni: Array<{
    id: number;
    ore: number;
    minuti: number;
    note: string | null;
    created_at: string;
    tempo_totale: string;
    user: { id: string; name: string };
    mezzi: { id: number; nome: string } | null;
    cantieri: { id: number; nome: string };
    attivita: { id: number; date: string; external_id: string };
    user_interazione_created_byTouser?: { id: string; name: string };
  }>;
};

type UsersResponse = { users: Array<{ id: string; name: string }> };
type MezziResponse = { mezzi: Array<{ id: number; nome: string }> };
type CantiereUsersResponse = {
  users: Array<{ user_id: string; cantieri_id: number; user: { id: string; name: string } }>;
};

export default function CantiereDetailPageClient({ slug }: { slug: string }) {
  const { mutate } = useSWRConfig();
  const { data: cantiereData, error: cantiereError } = useSWR<CantiereBySlug>(
    slug ? `/api/cantieri/${slug}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const cantiere = cantiereData?.cantiere;
  const cantiereId = cantiere?.id;

  const { data: interazioniData } = useSWR<InterazioniResponse>(
    cantiereId ? `/api/interazioni?cantiereId=${cantiereId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: usersData } = useSWR<UsersResponse>(
    "/api/users?notBanned=true&limit=500",
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: mezziData } = useSWR<MezziResponse>(
    "/api/mezzi?limit=500",
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: cantiereUsersData } = useSWR<CantiereUsersResponse>(
    cantiereId ? `/api/cantieri/${cantiereId}/users` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (cantiereError || (cantiereData && !cantiere)) {
    notFound();
  }

  if (!cantiere) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const interazioni = interazioniData?.interazioni ?? [];
  const users = usersData?.users ?? [];
  const mezzi = mezziData?.mezzi ?? [];
  const userCantieriList = cantiereUsersData?.users ?? [];
  const userCantieri = userCantieriList.map((u) => ({
    user_id: u.user_id,
    cantieri_id: u.cantieri_id,
  }));

  const cantiereForCard = {
    ...cantiere,
    created_at: new Date(cantiere.created_at),
    last_update_at: new Date(cantiere.last_update_at),
    closed_at: cantiere.closed_at ? new Date(cantiere.closed_at) : null,
  };

  // InterazioniTable expects interazioni with user_interazione_created_byTouser for search
  const interazioniForTable = interazioni.map((i) => ({
    ...i,
    user_interazione_created_byTouser: i.user_interazione_created_byTouser ?? i.user,
  }));

  // Attivita for table: unique attivita from interazioni (for display - table may use attivita date from each row)
  const attivita = Array.from(
    new Map(
      interazioni.map((i) => [i.attivita.id, { id: i.attivita.id, date: i.attivita.date }]),
    ).values(),
  );

  return (
    <div className="mx-auto px-6 py-8">
      <CantiereInfoCard
        cantiere={cantiereForCard}
        onCantiereUpdated={() => mutate(`/api/cantieri/${slug}`)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 border border-gray-200">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Utenti Assegnati</h2>
              <AssegnaUtenteCantiereModal
                cantiereId={cantiere.id}
                cantiereNome={cantiere.nome}
                users={users}
                userCantieri={userCantieri}
                onSuccess={() => mutate(`/api/cantieri/${cantiereId}/users`)}
              />
            </div>
            <div className="mb-4">
              {userCantieriList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userCantieriList.map((uc) => (
                    <div
                      key={uc.user_id}
                      className="card bg-base-100 shadow-sm border border-gray-200"
                    >
                      <div className="card-body p-4">
                        <h3 className="card-title text-sm flex items-center">
                          <UserIcon className="w-4 h-4" /> {uc.user.name}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <p>Nessun utente assegnato a questo cantiere.</p>
                  <p className="text-sm mt-2">
                    Clicca su "Gestisci Utenti" per assegnare utenti.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 mb-8">
          <TotalHoursFromInterazioniCard entries={interazioni} />
          <TotalInterazioniCountCard count={interazioni.length} />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Interazioni</h2>
      </div>

      <InterazioniTable
        interazioni={interazioniForTable}
        users={users}
        mezzi={mezzi}
        attivita={attivita}
        onSuccess={() =>
          mutate(`/api/interazioni?cantiereId=${cantiereId}&limit=500`)
        }
      />
    </div>
  );
}
