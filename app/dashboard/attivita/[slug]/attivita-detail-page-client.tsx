"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import AttivitaInfoCard from "@/components/attivita-info-card";
import AssenzeTableAttivita from "@/components/assenze-table-attivita";
import InterazioniTableAttivita from "@/components/interazioni-table-attivita";
import TrasportiTableAttivita from "@/components/trasporti-table-attivita";
import { fetcher } from "@/lib/api-fetcher";
import { ArrowLeftIcon } from "lucide-react";

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
    mezzi_trasportato?: { id: number; nome: string } | null;
    attrezzature?: { id: number; nome: string } | null;
    cantieri_partenza: { id: number; nome: string };
    cantieri_arrivo: { id: number; nome: string };
    attivita: { id: number; date: string };
  }>;
};

type MezziResponse = { mezzi: Array<{ id: number; nome: string }> };
type CantieriResponse = { cantieri: Array<{ id: number; nome: string }> };
type AttrezzatureResponse = {
  attrezzature: Array<{ id: number; nome: string }>;
};

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

  const { data: mezziCamionData } = useSWR<MezziResponse>(
    userId
      ? `/api/mezzi?userId=${userId}&limit=500&has_license_camion=true`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: mezziEscavatoreData } = useSWR<MezziResponse>(
    userId
      ? `/api/mezzi?userId=${userId}&limit=500&has_license_escavatore=true`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: cantieriData } = useSWR<CantieriResponse>(
    userId ? `/api/cantieri?userId=${userId}&limit=500` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: attrezzatureData } = useSWR<AttrezzatureResponse>(
    "/api/attrezzature?limit=500",
    fetcher,
    { revalidateOnFocus: false },
  );

  const interazioni = interazioniData?.interazioni ?? [];
  const assenze = assenzeData?.assenze ?? [];
  const trasporti = trasportiData?.trasporti ?? [];

  const totalHoursFormatted = useMemo(() => {
    const totalMilliseconds = [
      ...interazioni,
      ...assenze,
      ...trasporti,
    ].reduce((sum, e) => sum + Number(e.tempo_totale), 0);
    const totalMinutes = Math.floor(totalMilliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, [interazioni, assenze, trasporti]);

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

  const mezzi = mezziData?.mezzi ?? [];
  const mezziCamion = mezziCamionData?.mezzi ?? [];
  const mezziEscavatore = mezziEscavatoreData?.mezzi ?? [];
  const cantieri = cantieriData?.cantieri ?? [];
  const attrezzature = attrezzatureData?.attrezzature ?? [];

  const attivitaForCard = {
    ...attivita,
    date: new Date(attivita.date),
  };

  const mutateTrasporti = () => {
    if (attivitaId) mutate(`/api/trasporti?attivitaId=${attivitaId}&limit=500`);
    if (slug) mutate(`/api/attivita/${slug}`);
  };

  return (
    <div className="mx-auto md:px-6 py-8 px-2">
      <div className="mb-4">
        <Link href="/dashboard?tab=list" className="btn btn-sm btn-ghost">
          <ArrowLeftIcon className="w-4 h-4" /> Torna alle attività
        </Link>
      </div>

      <AttivitaInfoCard attivita={attivitaForCard} restrictDateRange />

      <div className="stats shadow w-full mb-8">
        <div className="stat">
          <div className="stat-title">Ore totali</div>
          <div className="stat-value text-primary">{totalHoursFormatted}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Interazioni</div>
          <div className="stat-value">{interazioni.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Trasporti</div>
          <div className="stat-value">{trasporti.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Assenze</div>
          <div className="stat-value">{assenze.length}</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl border border-gray-200">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-4">Interazioni</h2>
          <InterazioniTableAttivita
            interazioni={interazioni}
            mezzi={mezzi}
            cantieri={cantieri}
            attrezzature={attrezzature}
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
          <TrasportiTableAttivita
            trasporti={trasporti}
            cantieri={cantieri}
            mezzi={mezzi}
            mezziCamion={mezziCamion}
            mezziEscavatore={mezziEscavatore}
            attrezzature={attrezzature}
            onSuccess={mutateTrasporti}
          />
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
