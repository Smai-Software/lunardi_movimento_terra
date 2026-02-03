"use client";

import { notFound } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import AttivitaInfoCard from "@/components/attivita-info-card";
import AttivitaDetailClient from "@/app/admin/attivita/[slug]/attivita-detail-client";
import TotalHoursFromInterazioniCard from "@/components/total-hours-from-interazioni";
import TotalInterazioniCountCard from "@/components/total-interazioni-count-card";
import { fetcher } from "@/lib/api-fetcher";

type AttivitaBySlug = {
  attivita: {
    id: number;
    date: string;
    user_id: string;
    external_id: string;
    created_at: string;
    last_update_at: string;
    created_by: string;
    last_update_by: string;
    user: { id: string; name: string };
    user_attivita_created_byTouser: { id: string; name: string };
    user_attivita_last_update_byTouser: { id: string; name: string };
    interazioni?: Array<{ tempo_totale: string }>;
  };
};

type InterazioniResponse = {
  interazioni: Array<{
    id: number;
    ore: number;
    minuti: number;
    tempo_totale: string;
    note: string | null;
    created_at: string;
    user: { id: string; name: string };
    mezzi: { id: number; nome: string } | null;
    cantieri: { id: number; nome: string };
    attivita: { id: number; date: string };
  }>;
};

type AssenzeResponse = {
  assenze: Array<{
    id: number;
    tipo: string;
    ore: number;
    minuti: number;
    tempo_totale: string;
    note: string | null;
    created_at: string;
    user: { id: string; name: string };
    attivita: { id: number; date: string };
  }>;
};

type UsersResponse = { users: Array<{ id: string; name: string }> };
type MezziResponse = { mezzi: Array<{ id: number; nome: string }> };
type CantieriResponse = { cantieri: Array<{ id: number; nome: string }> };

export default function AttivitaDetailPageClient({
  slug,
}: {
  slug: string;
}) {
  const { mutate } = useSWRConfig();
  const { data: attivitaData, error: attivitaError } = useSWR<AttivitaBySlug>(
    slug ? `/api/attivita/${slug}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const attivita = attivitaData?.attivita;
  const attivitaId = attivita?.id;
  const userId = attivita?.user_id;

  const { data: interazioniData } = useSWR<InterazioniResponse>(
    attivitaId ? `/api/interazioni?attivitaId=${attivitaId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: assenzeData } = useSWR<AssenzeResponse>(
    attivitaId ? `/api/assenze?attivitaId=${attivitaId}&limit=500` : null,
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

  const { data: cantieriData } = useSWR<CantieriResponse>(
    userId ? `/api/cantieri?userId=${userId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (attivitaError || (attivitaData && !attivita)) {
    notFound();
  }

  if (!attivita) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const interazioni = interazioniData?.interazioni ?? [];
  const assenze = assenzeData?.assenze ?? [];
  const users = usersData?.users ?? [];
  const mezzi = mezziData?.mezzi ?? [];
  const cantieri = cantieriData?.cantieri ?? [];
  const totalHoursEntries = [
    ...interazioni.map((i) => ({ tempo_totale: i.tempo_totale })),
    ...assenze.map((a) => ({ tempo_totale: a.tempo_totale })),
  ];

  const attivitaForCard = {
    ...attivita,
    date: new Date(attivita.date),
    created_at: new Date(attivita.created_at),
    last_update_at: new Date(attivita.last_update_at),
  };

  return (
    <div className="mx-auto px-6 py-8">
      <AttivitaInfoCard
        attivita={attivitaForCard}
        onAttivitaUpdated={() => mutate(`/api/attivita/${slug}`)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TotalHoursFromInterazioniCard entries={totalHoursEntries} />
        <TotalInterazioniCountCard count={interazioni.length} />
      </div>

      <AttivitaDetailClient
        attivita={attivitaForCard}
        interazioni={interazioni}
        assenze={assenze}
        users={users}
        mezzi={mezzi}
        cantieri={cantieri}
        onInterazioniChange={() =>
          mutate(`/api/interazioni?attivitaId=${attivitaId}&limit=500`)
        }
        onAssenzeChange={() =>
          mutate(`/api/assenze?attivitaId=${attivitaId}&limit=500`)
        }
      />
    </div>
  );
}
