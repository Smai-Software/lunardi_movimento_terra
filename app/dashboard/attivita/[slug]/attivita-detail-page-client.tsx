"use client";

import { notFound } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { useState } from "react";
import AttivitaInfoCard from "@/components/attivita-info-card";
import AggiungiTrasportoModal from "@/components/aggiungi-trasporto-modal";
import AssenzeTableAttivita from "@/components/assenze-table-attivita";
import InterazioniTableAttivita from "@/components/interazioni-table-attivita";
import TotalHoursFromInterazioniCard from "@/components/total-hours-from-interazioni";
import TotalInterazioniCountCard from "@/components/total-interazioni-count-card";
import TrasportiTableAttivita from "@/components/trasporti-table-attivita";
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

type TrasportiResponse = {
  trasporti: Array<{
    id: number;
    ore: number;
    minuti: number;
    tempo_totale: string;
    note: string | null;
    created_at: string;
    user: { id: string; name: string };
    mezzi: { id: number; nome: string };
    cantieri_partenza: { id: number; nome: string };
    cantieri_arrivo: { id: number; nome: string };
    attivita: { id: number; date: string };
  }>;
};

type MezziResponse = { mezzi: Array<{ id: number; nome: string }> };
type CantieriResponse = { cantieri: Array<{ id: number; nome: string }> };

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

  const { data: assenzeData } = useSWR<AssenzeResponse>(
    attivitaId ? `/api/assenze?attivitaId=${attivitaId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: trasportiData } = useSWR<TrasportiResponse>(
    attivitaId ? `/api/trasporti?attivitaId=${attivitaId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: mezziData } = useSWR<MezziResponse>(
    userId ? `/api/mezzi?userId=${userId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: cantieriData } = useSWR<CantieriResponse>(
    userId ? `/api/cantieri?userId=${userId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [showAggiungiTrasporto, setShowAggiungiTrasporto] = useState(false);

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
  const assenze = assenzeData?.assenze ?? [];
  const trasporti = trasportiData?.trasporti ?? [];
  const mezzi = mezziData?.mezzi ?? [];
  const cantieri = cantieriData?.cantieri ?? [];
  const totalHoursEntries = [
    ...interazioni.map((i) => ({ tempo_totale: i.tempo_totale })),
    ...assenze.map((a) => ({ tempo_totale: a.tempo_totale })),
    ...trasporti.map((t) => ({ tempo_totale: t.tempo_totale })),
  ];

  const attivitaForCard = {
    ...attivita,
    date: new Date(attivita.date),
  };

  const mutateTrasporti = () => {
    if (attivitaId) mutate(`/api/trasporti?attivitaId=${attivitaId}&limit=500`);
    if (slug) mutate(`/api/attivita/${slug}`);
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
        <TotalHoursFromInterazioniCard entries={totalHoursEntries} />
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

      <div className="card bg-base-100 shadow-xl border border-gray-200 mt-6">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Trasporti</h2>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAggiungiTrasporto(true)}
            >
              Aggiungi Trasporto
            </button>
          </div>
          <TrasportiTableAttivita
            trasporti={trasporti}
            cantieri={cantieri}
            mezzi={mezzi}
            onSuccess={mutateTrasporti}
          />
          {showAggiungiTrasporto && (
            <AggiungiTrasportoModal
              attivitaId={attivita.id}
              userId={attivita.user_id}
              cantieri={cantieri}
              mezzi={mezzi}
              onClose={() => setShowAggiungiTrasporto(false)}
              onSuccess={mutateTrasporti}
            />
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl border border-gray-200 mt-6">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Assenze</h2>
          </div>
          <AssenzeTableAttivita
            assenze={assenze}
            onSuccess={() => {
              if (attivitaId)
                mutate(`/api/assenze?attivitaId=${attivitaId}&limit=500`);
              if (slug) mutate(`/api/attivita/${slug}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
