"use client";

import { useState } from "react";
import EliminaInterazioneModal from "@/components/elimina-interazione-modal";
import ModificaInterazioneModal from "@/components/modifica-interazione-modal";

type InterazioneRow = {
  id: number;
  ore: number;
  minuti: number;
  note: string | null;
  created_at: string;
  cantieri: { id: number; nome: string };
  mezzi: { id: number; nome: string } | null;
  attivita: { id: number; date: string };
  user: { id: string; name: string };
};

type InterazioniTableAttivitaProps = {
  interazioni: InterazioneRow[];
  mezzi: Array<{ id: number; nome: string }>;
  onSuccess?: () => void;
};

export default function InterazioniTableAttivita({
  interazioni,
  mezzi,
  onSuccess,
}: InterazioniTableAttivitaProps) {
  const [selectedInterazioneForEdit, setSelectedInterazioneForEdit] =
    useState<InterazioneRow | null>(null);
  const [selectedInterazioneForDelete, setSelectedInterazioneForDelete] =
    useState<InterazioneRow | null>(null);

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
              <th>Note</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {interazioni.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
                    <div className="max-w-xs truncate">
                      {interazione.note || ""}
                    </div>
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
          mezzi={mezzi}
          attivita={[
            {
              id: selectedInterazioneForEdit.attivita.id,
              date: selectedInterazioneForEdit.attivita.date,
            },
          ]}
          onClose={() => setSelectedInterazioneForEdit(null)}
          onSuccess={onSuccess}
        />
      )}
      {selectedInterazioneForDelete && (
        <EliminaInterazioneModal
          interazione={selectedInterazioneForDelete}
          onClose={() => setSelectedInterazioneForDelete(null)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
