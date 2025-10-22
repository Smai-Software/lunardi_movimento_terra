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

import type { UserNotBanned } from "@/lib/data/users.data";

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

  // Current form state
  const [currentCantiereId, setCurrentCantiereId] = useState("");
  const [currentMezzoId, setCurrentMezzoId] = useState("");
  const [currentOre, setCurrentOre] = useState(0);
  const [currentMinuti, setCurrentMinuti] = useState(0);

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
        router.push("/attivita");
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

  const addInterazione = () => {
    if (
      !currentCantiereId ||
      currentOre < 0 ||
      currentMinuti < 0 ||
      currentMinuti > 59
    ) {
      toast.error("Compila tutti i campi correttamente");
      return;
    }

    const cantiereId = parseInt(currentCantiereId, 10);
    const mezziId = currentMezzoId ? parseInt(currentMezzoId, 10) : null;

    const newInterazione: Interazione = {
      mezziId,
      ore: currentOre,
      minuti: currentMinuti,
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

    // Reset current form
    setCurrentMezzoId("");
    setCurrentOre(0);
    setCurrentMinuti(0);
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

  const removeCantiere = (cantiereIndex: number) => {
    const updatedCantieri = [...cantieri];
    updatedCantieri.splice(cantiereIndex, 1);
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
      })),
    );

    execute({
      date: selectedDate,
      user_id: selectedUserId,
      interazioni: allInterazioni,
    });
  };

  const getUsedCantieriIds = () => {
    return cantieri.map((c) => c.cantiereId);
  };

  const getAvailableCantieriForSelection = () => {
    const usedIds = getUsedCantieriIds();
    return availableCantieri.filter((c) => !usedIds.includes(c.id));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Step 1: Select User */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              1. Seleziona Operatore
            </h2>
            <div className="form-control">
              <label htmlFor="user-select" className="label">
                <span className="label-text">Operatore</span>
              </label>
              <select
                id="user-select"
                className="select select-bordered w-full"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
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

          {/* Step 2: Select Date */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Seleziona Data</h2>
            <div className="form-control">
              <label htmlFor="date-input" className="label">
                <span className="label-text">Data</span>
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

          {/* Step 3: Add Cantieri and Interazioni */}
          {selectedUserId && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                3. Aggiungi Interazioni
              </h2>

              {/* Add new interazione form */}
              <div className="card bg-base-200 p-4 mb-4">
                <h3 className="font-semibold mb-3">Aggiungi Interazione</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="form-control">
                    <label htmlFor="cantiere-select" className="label">
                      <span className="label-text">Cantiere</span>
                    </label>
                    <select
                      id="cantiere-select"
                      className="select select-bordered"
                      value={currentCantiereId}
                      onChange={(e) => setCurrentCantiereId(e.target.value)}
                      disabled={loadingCantieri}
                    >
                      <option value="">Seleziona cantiere</option>
                      {getAvailableCantieriForSelection().map((cantiere) => (
                        <option key={cantiere.id} value={cantiere.id}>
                          {cantiere.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label htmlFor="mezzo-select" className="label">
                      <span className="label-text">Mezzo (opzionale)</span>
                    </label>
                    <select
                      id="mezzo-select"
                      className="select select-bordered"
                      value={currentMezzoId}
                      onChange={(e) => setCurrentMezzoId(e.target.value)}
                      disabled={loadingMezzi}
                    >
                      <option value="">Nessuno</option>
                      {availableMezzi.map((mezzo) => (
                        <option key={mezzo.id} value={mezzo.id}>
                          {mezzo.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label htmlFor="ore-input" className="label">
                      <span className="label-text">Ore</span>
                    </label>
                    <input
                      id="ore-input"
                      type="number"
                      min="0"
                      className="input input-bordered"
                      value={currentOre}
                      onChange={(e) =>
                        setCurrentOre(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>

                  <div className="form-control">
                    <label htmlFor="minuti-input" className="label">
                      <span className="label-text">Minuti</span>
                    </label>
                    <input
                      id="minuti-input"
                      type="number"
                      min="0"
                      max="59"
                      className="input input-bordered"
                      value={currentMinuti}
                      onChange={(e) =>
                        setCurrentMinuti(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addInterazione}
                    disabled={!currentCantiereId || loadingCantieri}
                  >
                    Aggiungi Interazione
                  </button>
                </div>
              </div>

              {/* Display added cantieri and interazioni */}
              {cantieri.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Interazioni Aggiunte</h3>
                  {cantieri.map((cantiere, cantiereIndex) => (
                    <div
                      key={cantiere.cantiereId}
                      className="card bg-base-200 p-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold">
                          {cantiere.cantiereNome}
                        </h4>
                        <button
                          type="button"
                          className="btn btn-sm btn-error"
                          onClick={() => removeCantiere(cantiereIndex)}
                        >
                          Rimuovi Cantiere
                        </button>
                      </div>

                      <div className="space-y-2">
                        {cantiere.interazioni.map(
                          (interazione, interazioneIndex) => (
                            <div
                              key={`${cantiere.cantiereId}-${interazioneIndex}`}
                              className="flex justify-between items-center bg-base-100 p-2 rounded"
                            >
                              <div className="flex gap-4">
                                <span>
                                  <strong>Mezzo:</strong>{" "}
                                  {interazione.mezziId
                                    ? availableMezzi.find(
                                        (m) => m.id === interazione.mezziId,
                                      )?.nome || "N/A"
                                    : "Nessuno"}
                                </span>
                                <span>
                                  <strong>Tempo:</strong> {interazione.ore}h{" "}
                                  {interazione.minuti}m
                                </span>
                              </div>
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
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
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
              onClick={() => router.push("/attivita")}
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
