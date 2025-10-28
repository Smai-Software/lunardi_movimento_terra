"use client";

import { useState } from "react";
import AggiungiInterazioneModal from "@/components/aggiungi-interazione-modal";
import InterazioniTableAttivita from "@/components/interazioni-table-attivita";
import type { Interazione } from "@/lib/data/interazioni.data";
import type { UserNotBanned } from "@/lib/data/users.data";

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
  interazioni: Interazione[];
  users: UserNotBanned[];
  mezzi: Array<{ id: number; nome: string }>;
  cantieri: Array<{ id: number; nome: string }>;
};

export default function AttivitaDetailClient({
  attivita,
  interazioni,
  mezzi,
  cantieri,
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
      <InterazioniTableAttivita interazioni={interazioni} mezzi={mezzi} />

      {/* Aggiungi Interazione Modal */}
      {showAggiungiInterazione && (
        <AggiungiInterazioneModal
          attivitaId={attivita.id}
          userId={attivita.user_id}
          cantieri={cantieri}
          mezzi={mezzi}
          onClose={() => setShowAggiungiInterazione(false)}
        />
      )}
    </>
  );
}
