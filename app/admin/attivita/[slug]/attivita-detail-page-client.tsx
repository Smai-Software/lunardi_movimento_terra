"use client";

import { notFound } from "next/navigation";
import { useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import AttivitaDetailClient from "@/app/admin/attivita/[slug]/attivita-detail-client";
import AttivitaInfoCard from "@/components/attivita-info-card";
import { fetcher } from "@/lib/api-fetcher";

type AttivitaBySlug = {
  attivita: {
    id: number;
    date: string;
    user_id: string;
    external_id: string;
    is_checked: boolean;
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
    attrezzature: { id: number; nome: string } | null;
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

type UsersResponse = { users: Array<{ id: string; name: string }> };
type MezziResponse = { mezzi: Array<{ id: number; nome: string }> };
type AttrezzatureResponse = {
  attrezzature: Array<{ id: number; nome: string }>;
};
type CantieriResponse = { cantieri: Array<{ id: number; nome: string }> };

export default function AttivitaDetailPageClient({ slug }: { slug: string }) {
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

  const { data: trasportiData } = useSWR<TrasportiResponse>(
    attivitaId ? `/api/trasporti?attivitaId=${attivitaId}&limit=500` : null,
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

  const { data: mezziCamionData } = useSWR<MezziResponse>(
    "/api/mezzi?limit=500&has_license_camion=true",
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: mezziEscavatoreData } = useSWR<MezziResponse>(
    "/api/mezzi?limit=500&has_license_escavatore=true",
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
    const totalMilliseconds = [...interazioni, ...assenze, ...trasporti].reduce(
      (sum, e) => sum + Number(e.tempo_totale),
      0,
    );
    const totalMinutes = Math.floor(totalMilliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, [interazioni, assenze, trasporti]);

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

  const users = usersData?.users ?? [];
  const mezzi = mezziData?.mezzi ?? [];
  const attrezzature = attrezzatureData?.attrezzature ?? [];
  const mezziCamion = mezziCamionData?.mezzi ?? [];
  const mezziEscavatore = mezziEscavatoreData?.mezzi ?? [];
  const cantieri = cantieriData?.cantieri ?? [];

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
        showCheckAction
      />

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

      <AttivitaDetailClient
        attivita={attivitaForCard}
        interazioni={interazioni}
        assenze={assenze}
        trasporti={trasporti}
        users={users}
        mezzi={mezzi}
        attrezzature={attrezzature}
        cantieri={cantieri}
        mezziCamion={mezziCamion}
        mezziEscavatore={mezziEscavatore}
        onInterazioniChange={() =>
          mutate(`/api/interazioni?attivitaId=${attivitaId}&limit=500`)
        }
        onAssenzeChange={() =>
          mutate(`/api/assenze?attivitaId=${attivitaId}&limit=500`)
        }
        onTrasportiChange={() =>
          mutate(`/api/trasporti?attivitaId=${attivitaId}&limit=500`)
        }
      />
    </div>
  );
}
