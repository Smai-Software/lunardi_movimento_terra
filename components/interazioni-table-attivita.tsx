"use client";

import { useState } from "react";
import EliminaInterazioneModal from "@/components/elimina-interazione-modal";
import ModificaInterazioneModal from "@/components/modifica-interazione-modal";

import type { InterazioneAll } from "@/lib/data/interazioni.data";

type InterazioniTableAttivitaProps = {
  interazioni: InterazioneAll[];
  mezzi: Array<{ id: number; nome: string }>;
};

export default function InterazioniTableAttivita({
  interazioni,
  mezzi,
}: InterazioniTableAttivitaProps) {
  const [selectedInterazioneForEdit, setSelectedInterazioneForEdit] =
    useState<InterazioneAll | null>(null);
  const [selectedInterazioneForDelete, setSelectedInterazioneForDelete] =
    useState<InterazioneAll | null>(null);

  const formatTime = (ore: number, minuti: number) => {
    return `${ore}h ${minuti}m`;
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Cantiere</th>
              <th>Mezzo</th>
              <th>Tempo</th>
              <th>Data creazione</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {interazioni.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-base-content/60 py-8"
                >
                  Nessuna interazione trovata.
                </td>
              </tr>
            ) : (
              interazioni.map((interazione) => (
                <tr key={interazione.id}>
                  <td className="font-medium">
                    {interazione.cantieri.nome || "N/A"}
                  </td>
                  <td>{interazione.mezzi?.nome || "Nessuno"}</td>
                  <td>{formatTime(interazione.ore, interazione.minuti)}</td>
                  <td>
                    {new Date(interazione.created_at).toLocaleDateString(
                      "it-IT",
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() =>
                          setSelectedInterazioneForEdit(interazione)
                        }
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() =>
                          setSelectedInterazioneForDelete(interazione)
                        }
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedInterazioneForEdit && (
        <ModificaInterazioneModal
          interazione={selectedInterazioneForEdit}
          users={[]} // Not needed for this context
          mezzi={mezzi}
          attivita={[
            {
              id: selectedInterazioneForEdit.attivita.id,
              date: new Date(selectedInterazioneForEdit.attivita.date),
            },
          ]} // Simplified
          onClose={() => setSelectedInterazioneForEdit(null)}
        />
      )}
      {selectedInterazioneForDelete && (
        <EliminaInterazioneModal
          interazione={selectedInterazioneForDelete}
          onClose={() => setSelectedInterazioneForDelete(null)}
        />
      )}
    </div>
  );
}
