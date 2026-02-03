"use client";

import { useState } from "react";
import EliminaAssenzaModal from "@/components/elimina-assenza-modal";
import ModificaAssenzaModal from "@/components/modifica-assenza-modal";

const ASSENZA_TIPO_LABELS: Record<string, string> = {
  FERIE: "Ferie",
  PERMESSO: "Permesso",
  CASSA_INTEGRAZIONE: "Cassa integrazione",
  MUTUA: "Mutua",
  PATERNITA: "Paternità",
};

type AssenzaRow = {
  id: number;
  tipo: string;
  ore: number;
  minuti: number;
  note: string | null;
  created_at: string;
  user: { id: string; name: string };
  attivita: { id: number; date: string };
};

type AssenzeTableAttivitaProps = {
  assenze: AssenzaRow[];
  onSuccess?: () => void;
};

export default function AssenzeTableAttivita({
  assenze,
  onSuccess,
}: AssenzeTableAttivitaProps) {
  const [selectedAssenzaForEdit, setSelectedAssenzaForEdit] =
    useState<AssenzaRow | null>(null);
  const [selectedAssenzaForDelete, setSelectedAssenzaForDelete] =
    useState<AssenzaRow | null>(null);

  const formatTime = (ore: number, minuti: number) => {
    return `${ore}h ${minuti}m`;
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Tempo</th>
              <th>Data creazione</th>
              <th>Note</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {assenze.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-base-content/60 py-8"
                >
                  Nessuna assenza trovata.
                </td>
              </tr>
            ) : (
              assenze.map((assenza) => (
                <tr key={assenza.id}>
                  <td className="font-medium">
                    {ASSENZA_TIPO_LABELS[assenza.tipo] ?? assenza.tipo}
                  </td>
                  <td>{formatTime(assenza.ore, assenza.minuti)}</td>
                  <td>
                    {new Date(assenza.created_at).toLocaleDateString("it-IT")}
                  </td>
                  <td>
                    <div className="max-w-xs truncate">
                      {assenza.note || ""}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setSelectedAssenzaForEdit(assenza)}
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => setSelectedAssenzaForDelete(assenza)}
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

      {selectedAssenzaForEdit && (
        <ModificaAssenzaModal
          assenza={selectedAssenzaForEdit}
          attivita={[
            {
              id: selectedAssenzaForEdit.attivita.id,
              date: selectedAssenzaForEdit.attivita.date,
            },
          ]}
          onClose={() => setSelectedAssenzaForEdit(null)}
          onSuccess={onSuccess}
        />
      )}
      {selectedAssenzaForDelete && (
        <EliminaAssenzaModal
          assenza={selectedAssenzaForDelete}
          onClose={() => setSelectedAssenzaForDelete(null)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
