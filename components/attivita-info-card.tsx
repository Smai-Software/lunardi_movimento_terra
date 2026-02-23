"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import EliminaAttivitaModal from "@/components/elimina-attivita-modal";
import ModificaAttivitaModal from "@/components/modifica-attivita-modal";

type AttivitaInfoCardProps = {
  attivita: {
    id: number;
    date: Date | string;
    user_id: string;
    user: { id: string; name: string };
    is_checked?: boolean;
  };
  onAttivitaUpdated?: () => void;
  /** Quando true (dashboard user), in "Modifica data" limita a max 7 giorni indietro e non futura */
  restrictDateRange?: boolean;
  /** Quando true (solo admin), mostra il bottone "Registra" se l'attività non è ancora spuntata */
  showCheckAction?: boolean;
};

export default function AttivitaInfoCard({
  attivita,
  onAttivitaUpdated,
  restrictDateRange = false,
  showCheckAction = false,
}: AttivitaInfoCardProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckedOptimistic, setIsCheckedOptimistic] = useState(
    attivita.is_checked === true
  );

  useEffect(() => {
    setIsCheckedOptimistic(attivita.is_checked === true);
  }, [attivita.is_checked]);

  const handleRegistra = async () => {
    if (isCheckedOptimistic || isRegistering) return;
    setIsRegistering(true);
    try {
      const res = await fetch(`/api/attivita/${attivita.id}/check`, {
        method: "PATCH",
      });
      if (res.ok) {
        setIsCheckedOptimistic(true);
        toast.success("Attività registrata con successo!");
        onAttivitaUpdated?.();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error || "Errore durante la registrazione"
        );
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
      <h1 className="card-title text-lg md:text-3xl">
        {new Date(attivita.date).toLocaleDateString("it-IT")} -{" "}
        {attivita.user.name}
      </h1>
      <div className="flex gap-2">
        {showCheckAction && !isCheckedOptimistic ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleRegistra}
            disabled={isRegistering}
          >
            {isRegistering ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Registra"
            )}
          </button>
        ) : null}
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
