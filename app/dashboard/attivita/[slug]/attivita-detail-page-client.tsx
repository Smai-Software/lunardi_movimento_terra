"use client";

import { notFound } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import AttivitaInfoCard from "@/components/attivita-info-card";
import InterazioniTableAttivita from "@/components/interazioni-table-attivita";
import TotalHoursFromInterazioniCard from "@/components/total-hours-from-interazioni";
import TotalInterazioniCountCard from "@/components/total-interazioni-count-card";
import { fetcher } from "@/lib/api-fetcher";

type AttivitaBySlug = {
  attivita: {
    id: number;
    date: string;
    user_id: string;
    external_id: string;
    user: { id: string; name: string };
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
    cantieri: { id: number; nome: string };
    mezzi: { id: number; nome: string } | null;
    attivita: { id: number; date: string };
  }>;
};

type MezziResponse = { mezzi: Array<{ id: number; nome: string }> };

export default function UserAttivitaDetailPageClient({
  slug,
  userId,
}: {
  slug: string;
  userId: string;
}) {
  const { mutate } = useSWRConfig();
  const { data: attivitaData, error: attivitaError } = useSWR<AttivitaBySlug>(
    slug ? `/api/attivita/${slug}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const attivita = attivitaData?.attivita;
  const attivitaId = attivita?.id;

  const { data: interazioniData } = useSWR<InterazioniResponse>(
    attivitaId ? `/api/interazioni?attivitaId=${attivitaId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: mezziData } = useSWR<MezziResponse>(
    userId ? `/api/mezzi?userId=${userId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (attivitaError || (attivitaData && !attivita)) {
    notFound();
  }

  if (attivita && attivita.user_id !== userId) {
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
  const mezzi = mezziData?.mezzi ?? [];

  const attivitaForCard = {
    ...attivita,
    date: new Date(attivita.date),
  };

  return (
    <div className="mx-auto px-6 py-8">
      <div className="mb-4">
        <Link href="/dashboard?tab=list" className="btn btn-sm btn-ghost">
          ← Torna alle attività
        </Link>
      </div>

      <AttivitaInfoCard attivita={attivitaForCard} restrictDateRange />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <TotalHoursFromInterazioniCard interazioni={interazioni} />
        <TotalInterazioniCountCard count={interazioni.length} />
      </div>

      <div className="card bg-base-100 shadow-xl border border-gray-200">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-4">Interazioni</h2>
          <InterazioniTableAttivita
          interazioni={interazioni}
          mezzi={mezzi}
          onSuccess={() => {
            if (attivitaId)
              mutate(`/api/interazioni?attivitaId=${attivitaId}&limit=500`);
            if (slug) mutate(`/api/attivita/${slug}`);
          }}
        />
        </div>
      </div>
    </div>
  );
}
