"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { createAttivitaWithInterazioni } from "@/lib/actions/attivita.actions";
import { getCantieriForUser } from "@/lib/actions/cantieri.actions";
import { getMezziForUser } from "@/lib/actions/mezzi.actions";
import AggiungiInterazioneModalForm from "@/components/aggiungi-interazione-modal-form";

import type { UserNotBanned } from "@/lib/data/users.data";
import { TrashIcon } from "lucide-react";

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

type AttivitaFormProps = {
  users: UserNotBanned[];
};

function AttivitaForm({ users }: AttivitaFormProps) {
  const router = useRouter();

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [cantieri, setCantieri] = useState<CantiereWithInterazioni[]>([]);

  // Available options
  const [availableCantieri, setAvailableCantieri] = useState<Cantiere[]>([]);
  const [availableMezzi, setAvailableMezzi] = useState<Mezzo[]>([]);

  // Loading states
  const [loadingCantieri, setLoadingCantieri] = useState(false);
  const [loadingMezzi, setLoadingMezzi] = useState(false);

  const fetchUserResources = useCallback(async () => {
    if (!selectedUserId) return;

    setLoadingCantieri(true);
    setLoadingMezzi(true);

    try {
      const [cantieriResult, mezziResult] = await Promise.all([
        getCantieriForUser({ userId: selectedUserId }),
        getMezziForUser({ userId: selectedUserId }),
      ]);

      if (cantieriResult?.data?.success) {
        setAvailableCantieri(cantieriResult.data.cantieri);
      } else {
        toast.error(
          cantieriResult?.data?.error || "Errore nel caricamento dei cantieri",
        );
      }

      if (mezziResult?.data?.success) {
        setAvailableMezzi(mezziResult.data.mezzi);
      } else {
        toast.error(
          mezziResult?.data?.error || "Errore nel caricamento dei mezzi",
        );
      }
    } catch {
      toast.error("Errore nel caricamento delle risorse");
    } finally {
      setLoadingCantieri(false);
      setLoadingMezzi(false);
    }
  }, [selectedUserId]);

  const { execute, result } = useAction(createAttivitaWithInterazioni, {
    onSuccess: () => {
      if (result.data?.success) {
        toast.success("Attività creata con successo!");
        router.push("/admin/attivita");
      }
    },
  });

  // Fetch cantieri and mezzi when user is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchUserResources();
    } else {
      setAvailableCantieri([]);
      setAvailableMezzi([]);
    }
  }, [selectedUserId, fetchUserResources]);

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

    // Check if cantiere already exists
    const existingCantiereIndex = cantieri.findIndex(
      (c) => c.cantiereId === cantiereId,
    );

    if (existingCantiereIndex >= 0) {
      // Add interazione to existing cantiere
      const updatedCantieri = [...cantieri];
      updatedCantieri[existingCantiereIndex].interazioni.push(newInterazione);
      setCantieri(updatedCantieri);
    } else {
      // Create new cantiere with interazione
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

    // Remove cantiere if no more interazioni
    if (updatedCantieri[cantiereIndex].interazioni.length === 0) {
      updatedCantieri.splice(cantiereIndex, 1);
    }

    setCantieri(updatedCantieri);
  };

  const handleSubmit = () => {
    if (!selectedUserId || !selectedDate || cantieri.length === 0) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    // Flatten all interazioni
    const allInterazioni = cantieri.flatMap((cantiere) =>
      cantiere.interazioni.map((interazione) => ({
        cantieri_id: cantiere.cantiereId,
        mezzi_id: interazione.mezziId,
        ore: interazione.ore,
        minuti: interazione.minuti,
        note: interazione.note,
      })),
    );

    execute({
      date: selectedDate,
      user_id: selectedUserId,
      interazioni: allInterazioni,
    });
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
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="form-control">
                <label htmlFor="user-select" className="label">
                  <span className="font-medium">Operatore</span>
                </label>
                <select
                  id="user-select"
                  className="select select-bordered w-full"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  disabled={selectedDate === ""}
                >
                  <option value="">Seleziona un operatore</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Add Cantieri and Interazioni */}
          {selectedUserId && (
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

              {/* Display added cantieri and interazioni */}
              {cantieri.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Interazioni Aggiunte</h3>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th className="md:hidden"></th>
                          <th>Cantiere</th>
                          <th>Mezzo</th>
                          <th>Tempo</th>
                          <th>Note</th>
                          <th className="hidden md:table-cell">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cantieri.flatMap((cantiere, cantiereIndex) =>
                          cantiere.interazioni.map(
                            (interazione, interazioneIndex) => (
                              <tr
                                key={`${cantiere.cantiereId}-${interazioneIndex}`}
                              >
                                <td className="md:hidden">
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
                                    <TrashIcon className="size-4" />
                                  </button>
                                </td>
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
                                  <div className="max-w-[100px] truncate">
                                    {interazione.note || ""}
                                  </div>
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
                                    Rimuovi
                                  </button>
                                </td>
                              </tr>
                            ),
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Total Hours Summary */}
                  {cantieri.length > 0 && (
                    <div className="mt-4">
                      <div className="card bg-primary text-primary-content">
                        <div className="card-body py-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Totale Ore:</span>
                            <span className="text-lg font-bold">
                              {getTotalHours()
                                .hours.toString()
                                .padStart(2, "0")}
                              :
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
          )}

          {/* Submit */}
          <div className="card-actions justify-end">
            <ValidationErrors result={result} />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => router.push("/admin/attivita")}
            >
              Annulla
            </button>
            <SubmitButton
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={
                !selectedUserId || !selectedDate || cantieri.length === 0
              }
            >
              Crea Attività
            </SubmitButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttivitaForm;
