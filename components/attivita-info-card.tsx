"use client";

import EliminaAttivitaModal from "@/components/elimina-attivita-modal";
import ModificaAttivitaModal from "@/components/modifica-attivita-modal";

type AttivitaInfoCardProps = {
  attivita: {
    id: number;
    date: Date | string;
    user_id: string;
    user: { id: string; name: string };
  };
  onAttivitaUpdated?: () => void;
  /** Quando true (dashboard user), in "Modifica data" limita a max 7 giorni indietro e non futura */
  restrictDateRange?: boolean;
};

export default function AttivitaInfoCard({
  attivita,
  onAttivitaUpdated,
  restrictDateRange = false,
}: AttivitaInfoCardProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="card-title text-3xl">
        {new Date(attivita.date).toLocaleDateString("it-IT")} -{" "}
        {attivita.user.name}
      </h1>
      <div className="flex gap-2">
        <ModificaAttivitaModal
          attivita={{
            id: attivita.id,
            date: new Date(attivita.date).toISOString().split("T")[0],
            user_id: attivita.user_id,
          }}
          onSuccess={onAttivitaUpdated}
          restrictDateRange={restrictDateRange}
        />
        <EliminaAttivitaModal
          attivita={{
            id: attivita.id,
            date: attivita.date.toString(),
            user: attivita.user.name,
          }}
          onSuccess={onAttivitaUpdated}
        />
      </div>
    </div>
  );
}
