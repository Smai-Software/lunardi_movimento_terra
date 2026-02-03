"use client";

import { useState } from "react";
import AggiungiAssenzaModal from "@/components/aggiungi-assenza-modal";
import AggiungiInterazioneModal from "@/components/aggiungi-interazione-modal";
import AggiungiTrasportoModal from "@/components/aggiungi-trasporto-modal";
import AssenzeTableAttivita from "@/components/assenze-table-attivita";
import InterazioniTableAttivita from "@/components/interazioni-table-attivita";
import TrasportiTableAttivita from "@/components/trasporti-table-attivita";

type AttivitaDetailClientProps = {
  attivita: {
    id: number;
    date: Date;
    user_id: string;
    external_id: string;
    created_at: Date;
    last_update_at: Date;
    created_by: string;
    last_update_by: string;
    user: {
      id: string;
      name: string;
    };
    user_attivita_created_byTouser: {
      id: string;
      name: string;
    };
    user_attivita_last_update_byTouser: {
      id: string;
      name: string;
    };
  };
  interazioni: Array<{
    id: number;
    ore: number;
    minuti: number;
    note: string | null;
    created_at: string;
    user: { id: string; name: string };
    cantieri: { id: number; nome: string };
    mezzi: { id: number; nome: string } | null;
    attivita: { id: number; date: string };
  }>;
  assenze: Array<{
    id: number;
    tipo: string;
    ore: number;
    minuti: number;
    note: string | null;
    created_at: string;
    user: { id: string; name: string };
    attivita: { id: number; date: string };
  }>;
  trasporti: Array<{
    id: number;
    ore: number;
    minuti: number;
    note: string | null;
    created_at: string;
    user: { id: string; name: string };
    mezzi: { id: number; nome: string };
    cantieri_partenza: { id: number; nome: string };
    cantieri_arrivo: { id: number; nome: string };
    attivita: { id: number; date: string };
  }>;
  users: Array<{ id: string; name: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  cantieri: Array<{ id: number; nome: string }>;
  onInterazioniChange?: () => void;
  onAssenzeChange?: () => void;
  onTrasportiChange?: () => void;
};

export default function AttivitaDetailClient({
  attivita,
  interazioni,
  assenze,
  trasporti,
  mezzi,
  cantieri,
  onInterazioniChange,
  onAssenzeChange,
  onTrasportiChange,
}: AttivitaDetailClientProps) {
  const [showAggiungiInterazione, setShowAggiungiInterazione] = useState(false);
  const [showAggiungiAssenza, setShowAggiungiAssenza] = useState(false);
  const [showAggiungiTrasporto, setShowAggiungiTrasporto] = useState(false);

  return (
    <>
      {/* Interazioni Section */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Interazioni</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAggiungiInterazione(true)}
        >
          Aggiungi Interazione
        </button>
      </div>

      <InterazioniTableAttivita
        interazioni={interazioni}
        mezzi={mezzi}
        onSuccess={onInterazioniChange}
      />

      {showAggiungiInterazione && (
        <AggiungiInterazioneModal
          attivitaId={attivita.id}
          userId={attivita.user_id}
          cantieri={cantieri}
          mezzi={mezzi}
          onClose={() => setShowAggiungiInterazione(false)}
          onSuccess={onInterazioniChange}
        />
      )}

      {/* Trasporti Section */}
      <div className="mb-6 flex justify-between items-center mt-10">
        <h2 className="text-2xl font-bold">Trasporti</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAggiungiTrasporto(true)}
        >
          Aggiungi Trasporto
        </button>
      </div>

      <TrasportiTableAttivita
        trasporti={trasporti}
        cantieri={cantieri}
        mezzi={mezzi}
        onSuccess={onTrasportiChange}
      />

      {showAggiungiTrasporto && (
        <AggiungiTrasportoModal
          attivitaId={attivita.id}
          userId={attivita.user_id}
          cantieri={cantieri}
          mezzi={mezzi}
          onClose={() => setShowAggiungiTrasporto(false)}
          onSuccess={onTrasportiChange}
        />
      )}

      {/* Assenze Section */}
      <div className="mb-6 flex justify-between items-center mt-10">
        <h2 className="text-2xl font-bold">Assenze</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAggiungiAssenza(true)}
        >
          Aggiungi Assenza
        </button>
      </div>

      <AssenzeTableAttivita assenze={assenze} onSuccess={onAssenzeChange} />

      {showAggiungiAssenza && (
        <AggiungiAssenzaModal
          attivitaId={attivita.id}
          userId={attivita.user_id}
          onClose={() => setShowAggiungiAssenza(false)}
          onSuccess={onAssenzeChange}
        />
      )}
    </>
  );
}
