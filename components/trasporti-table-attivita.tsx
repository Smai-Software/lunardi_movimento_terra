"use client";

import EliminaTrasportoModal from "@/components/elimina-trasporto-modal";
import ModificaTrasportoModal from "@/components/modifica-trasporto-modal";

type TrasportoRow = {
  id: number;
  ore: number;
  minuti: number;
  note: string | null;
  created_at: string;
  cantieri_partenza: { id: number; nome: string };
  cantieri_arrivo: { id: number; nome: string };
  mezzi: { id: number; nome: string };
  attivita: { id: number; date: string };
  user: { id: string; name: string };
};

type TrasportiTableAttivitaProps = {
  trasporti: TrasportoRow[];
  cantieri: Array<{ id: number; nome: string }>;
  mezzi: Array<{ id: number; nome: string }>;
  onSuccess?: () => void;
};

export default function TrasportiTableAttivita({
  trasporti,
  cantieri,
  mezzi,
  onSuccess,
}: TrasportiTableAttivitaProps) {
  const formatTime = (ore: number, minuti: number) => `${ore}h ${minuti}m`;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg shadow content-visibility-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Partenza</th>
              <th>Arrivo</th>
              <th>Mezzo</th>
              <th>Tempo</th>
              <th>Data creazione</th>
              <th>Note</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {trasporti.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-base-content/60 py-8">
                  Nessun trasporto trovato.
                </td>
              </tr>
            ) : (
              trasporti.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.cantieri_partenza.nome}</td>
                  <td>{t.cantieri_arrivo.nome}</td>
                  <td>{t.mezzi.nome}</td>
                  <td>{formatTime(t.ore, t.minuti)}</td>
                  <td>{new Date(t.created_at).toLocaleDateString("it-IT")}</td>
                  <td className="max-w-xs truncate">{t.note || ""}</td>
                  <td>
                    <div className="flex gap-2">
                      <ModificaTrasportoModal
                        trasporto={t}
                        cantieri={cantieri}
                        mezzi={mezzi}
                        onSuccess={onSuccess}
                      />
                      <EliminaTrasportoModal
                        trasporto={t}
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
