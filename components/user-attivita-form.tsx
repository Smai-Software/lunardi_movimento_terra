"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AggiungiInterazioneModalForm from "@/components/aggiungi-interazione-modal-form";
import { Loader2Icon, TrashIcon } from "lucide-react";

type Cantiere = {
  id: number;
  nome: string;
  descrizione: string;
  open: boolean;
};

type Mezzo = {
  id: number;
  nome: string;
  descrizione: string;
  has_license_camion: boolean;
  has_license_escavatore: boolean;
};

type Interazione = {
  mezziId: number | null;
  ore: number;
  minuti: number;
  note: string;
};

type CantiereWithInterazioni = {
  cantiereId: number;
  cantiereNome: string;
  interazioni: Interazione[];
};

type UserAttivitaFormProps = {
  userId: string;
};

function UserAttivitaForm({ userId }: UserAttivitaFormProps) {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [cantieri, setCantieri] = useState<CantiereWithInterazioni[]>([]);

  const [availableCantieri, setAvailableCantieri] = useState<Cantiere[]>([]);
  const [availableMezzi, setAvailableMezzi] = useState<Mezzo[]>([]);

  const [loadingCantieri, setLoadingCantieri] = useState(false);
  const [loadingMezzi, setLoadingMezzi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserResources = useCallback(async () => {
    setLoadingCantieri(true);
    setLoadingMezzi(true);

    try {
      const [cantieriRes, mezziRes] = await Promise.all([
        fetch(`/api/cantieri?userId=${userId}&limit=500`),
        fetch(`/api/mezzi?userId=${userId}&limit=500`),
      ]);

      const cantieriData = await cantieriRes.json().catch(() => ({}));
      const mezziData = await mezziRes.json().catch(() => ({}));

      if (cantieriRes.ok && Array.isArray(cantieriData.cantieri)) {
        setAvailableCantieri(cantieriData.cantieri);
      } else {
        toast.error(
          (cantieriData as { error?: string }).error || "Errore nel caricamento dei cantieri",
        );
      }

      if (mezziRes.ok && Array.isArray(mezziData.mezzi)) {
        setAvailableMezzi(mezziData.mezzi);
      } else {
        toast.error(
          (mezziData as { error?: string }).error || "Errore nel caricamento dei mezzi",
        );
      }
    } catch {
      toast.error("Errore nel caricamento delle risorse");
    } finally {
      setLoadingCantieri(false);
      setLoadingMezzi(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserResources();
    } else {
      setAvailableCantieri([]);
      setAvailableMezzi([]);
    }
  }, [userId, fetchUserResources]);

  const addInterazione = (
    cantiereId: number,
    mezziId: number | null,
    ore: number,
    minuti: number,
    note: string,
  ) => {
    if (ore < 0 || minuti < 0 || minuti > 59) {
      toast.error("Compila tutti i campi correttamente");
      return;
    }

    const newInterazione: Interazione = {
      mezziId,
      ore,
      minuti,
      note,
    };

    const existingCantiereIndex = cantieri.findIndex(
      (c) => c.cantiereId === cantiereId,
    );

    if (existingCantiereIndex >= 0) {
      const updatedCantieri = [...cantieri];
      updatedCantieri[existingCantiereIndex].interazioni.push(newInterazione);
      setCantieri(updatedCantieri);
    } else {
      const cantiereNome =
        availableCantieri.find((c) => c.id === cantiereId)?.nome || "";
      setCantieri([
        ...cantieri,
        {
          cantiereId,
          cantiereNome,
          interazioni: [newInterazione],
        },
      ]);
    }
  };

  const removeInterazione = (
    cantiereIndex: number,
    interazioneIndex: number,
  ) => {
    const updatedCantieri = [...cantieri];
    updatedCantieri[cantiereIndex].interazioni.splice(interazioneIndex, 1);

    if (updatedCantieri[cantiereIndex].interazioni.length === 0) {
      updatedCantieri.splice(cantiereIndex, 1);
    }

    setCantieri(updatedCantieri);
  };

  const getTodayLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getMinDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!selectedDate || cantieri.length === 0) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    if (selectedDate > getTodayLocalDateString()) {
      toast.error("La data non può essere futura");
      return;
    }
    if (selectedDate < getMinDateString()) {
      toast.error("La data non può essere più di 7 giorni indietro");
      return;
    }

    const allInterazioni = cantieri.flatMap((cantiere) =>
      cantiere.interazioni.map((interazione) => ({
        cantieri_id: cantiere.cantiereId,
        mezzi_id: interazione.mezziId,
        ore: interazione.ore,
        minuti: interazione.minuti,
        note: interazione.note,
      })),
    );

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/attivita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          user_id: userId,
          interazioni: allInterazioni,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nella creazione");
      }
      toast.success("Attività creata con successo!");
      router.push("/dashboard?tab=list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalHours = () => {
    const totalMinutes = cantieri.reduce((total, cantiere) => {
      return (
        total +
        cantiere.interazioni.reduce((cantiereTotal, interazione) => {
          return cantiereTotal + interazione.ore * 60 + interazione.minuti;
        }, 0)
      );
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card bg-base-100 shadow-xl border border-gray-200">
        <div className="card-body">
          <h1 className="text-xl font-bold">Nuova Attività</h1>
          <p className="text-gray-600">
            Crea una nuova attività con interazioni per cantieri e mezzi
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="mb-6">
              <div className="form-control">
                <label htmlFor="date-input" className="label">
                  <span className="font-medium">Data</span>
                </label>
                <input
                  id="date-input"
                  type="date"
                  className="input input-bordered w-full"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDateString()}
                  max={getTodayLocalDateString()}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold">Interazioni</h2>
              <AggiungiInterazioneModalForm
                availableCantieri={availableCantieri}
                availableMezzi={availableMezzi}
                loadingCantieri={loadingCantieri}
                loadingMezzi={loadingMezzi}
                onAddInterazione={addInterazione}
              />
            </div>

            {cantieri.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Interazioni Aggiunte</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Cantiere</th>
                        <th>Mezzo</th>
                        <th>Tempo</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cantieri.flatMap((cantiere, cantiereIndex) =>
                        cantiere.interazioni.map(
                          (interazione, interazioneIndex) => (
                            <tr
                              key={`${cantiere.cantiereId}-${interazioneIndex}`}
                            >
                              <td className="font-medium">
                                {cantiere.cantiereNome}
                              </td>
                              <td>
                                {interazione.mezziId
                                  ? availableMezzi.find(
                                      (m) => m.id === interazione.mezziId,
                                    )?.nome || "N/A"
                                  : "Nessuno"}
                              </td>
                              <td>
                                {interazione.ore}h {interazione.minuti}m
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline btn-error"
                                  onClick={() =>
                                    removeInterazione(
                                      cantiereIndex,
                                      interazioneIndex,
                                    )
                                  }
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ),
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {cantieri.length > 0 && (
                  <div className="mt-4">
                    <div className="card bg-primary text-primary-content">
                      <div className="card-body py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Totale Ore:</span>
                          <span className="text-lg font-bold">
                            {getTotalHours().hours.toString().padStart(2, "0")}:
                            {getTotalHours()
                              .minutes.toString()
                              .padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card-actions justify-end">
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => router.push("/dashboard?tab=list")}
            >
              Annulla
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!selectedDate || cantieri.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                "Crea Attività"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserAttivitaForm;
