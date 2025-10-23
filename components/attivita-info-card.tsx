"use client";

import { useState } from "react";
import EliminaAttivitaModal from "@/components/elimina-attivita-modal";
import ModificaAttivitaModal from "@/components/modifica-attivita-modal";
import type { AttivitaDetail } from "@/lib/data/attivita.data";

type AttivitaInfoCardProps = {
  attivita: AttivitaDetail;
};

export default function AttivitaInfoCard({ attivita }: AttivitaInfoCardProps) {
  const [showModificaAttivita, setShowModificaAttivita] = useState(false);
  const [showEliminaAttivita, setShowEliminaAttivita] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="card-title text-3xl">
          {new Date(attivita.date).toLocaleDateString("it-IT")} -{" "}
          {attivita.user.name}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowModificaAttivita(true)}
          >
            Modifica data
          </button>
          <button
            type="button"
            className="btn btn-outline btn-error btn-sm"
            onClick={() => setShowEliminaAttivita(true)}
          >
            Elimina attività
          </button>
        </div>
      </div>

      {/* Modals */}
      {showModificaAttivita && (
        <ModificaAttivitaModal
          attivita={{
            id: attivita.id,
            date: new Date(attivita.date).toISOString().split("T")[0],
            user_id: attivita.user_id,
          }}
          onClose={() => setShowModificaAttivita(false)}
        />
      )}

      {showEliminaAttivita && (
        <EliminaAttivitaModal
          attivita={{
            id: attivita.id,
            date: attivita.date.toString(),
            user: attivita.user.name,
          }}
          onClose={() => setShowEliminaAttivita(false)}
        />
      )}
    </>
  );
}
