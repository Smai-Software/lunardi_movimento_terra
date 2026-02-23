"use client";

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
  attrezzature?: { id: number; nome: string } | null;
  attivita: { id: number; date: string };
  user: { id: string; name: string };
};

type InterazioniTableAttivitaProps = {
  interazioni: InterazioneRow[];
  mezzi: Array<{ id: number; nome: string }>;
  attrezzature?: Array<{ id: number; nome: string }>;
  cantieri: Array<{ id: number; nome: string }>;
  onSuccess?: () => void;
};

export default function InterazioniTableAttivita({
  interazioni,
  mezzi,
  attrezzature,
  cantieri,
  onSuccess,
}: InterazioniTableAttivitaProps) {
  const formatTime = (ore: number, minuti: number) => {
    return `${ore}h ${minuti}m`;
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg shadow content-visibility-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Cantiere</th>
              <th>Mezzo</th>
              <th>Attrezzatura</th>
              <th>Tempo</th>
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
                  <td>{interazione.attrezzature?.nome ?? "Nessuna"}</td>
                  <td>{formatTime(interazione.ore, interazione.minuti)}</td>
                  <td className="max-w-[280px] break-words whitespace-normal align-top">
                    {interazione.note || ""}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <ModificaInterazioneModal
                        interazione={interazione}
                        mezzi={mezzi}
                        attrezzature={attrezzature ?? []}
                        cantieri={cantieri}
                        attivita={[
                          {
                            id: interazione.attivita.id,
                            date: interazione.attivita.date,
                          },
                        ]}
                        onSuccess={onSuccess}
                      />
                      <EliminaInterazioneModal
                        interazione={interazione}
                        onSuccess={onSuccess}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
