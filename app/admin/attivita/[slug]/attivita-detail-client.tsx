"use client";

import { useState } from "react";
import AggiungiInterazioneModal from "@/components/aggiungi-interazione-modal";
import InterazioniTableAttivita from "@/components/interazioni-table-attivita";
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
  users: Array<{ id: string; name: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  cantieri: Array<{ id: number; nome: string }>;
  onInterazioniChange?: () => void;
};

export default function AttivitaDetailClient({
  attivita,
  interazioni,
  mezzi,
  cantieri,
  onInterazioniChange,
}: AttivitaDetailClientProps) {
  const [showAggiungiInterazione, setShowAggiungiInterazione] = useState(false);

  return (
    <>
      {/* Interazioni Section Header */}
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

      {/* Interazioni Table */}
      <InterazioniTableAttivita
        interazioni={interazioni}
        mezzi={mezzi}
        onSuccess={onInterazioniChange}
      />

      {/* Aggiungi Interazione Modal */}
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
    </>
  );
}
