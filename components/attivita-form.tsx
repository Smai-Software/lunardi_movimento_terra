"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AggiungiAssenzaModalForm from "@/components/aggiungi-assenza-modal-form";
import AggiungiInterazioneModalForm from "@/components/aggiungi-interazione-modal-form";
import AggiungiTrasportoModalForm from "@/components/aggiungi-trasporto-modal-form";
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

type Assenza = {
  localId: string;
  tipo: string;
  ore: number;
  minuti: number;
  note: string;
};

type Trasporto = {
  localId: string;
  cantieriPartenzaId: number;
  cantieriArrivoId: number;
  mezziId: number;
  ore: number;
  minuti: number;
  note: string;
};

const ASSENZA_TIPO_LABELS: Record<string, string> = {
  FERIE: "Ferie",
  PERMESSO: "Permesso",
  CASSA_INTEGRAZIONE: "Cassa integrazione",
  MUTUA: "Mutua",
  PATERNITA: "Paternità",
};

type AttivitaFormProps = {
  users?: Array<{ id: string; name: string }>;
};

function AttivitaForm({ users: usersProp }: AttivitaFormProps) {
  const router = useRouter();

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [cantieri, setCantieri] = useState<CantiereWithInterazioni[]>([]);
  const [assenze, setAssenze] = useState<Assenza[]>([]);
  const [trasporti, setTrasporti] = useState<Trasporto[]>([]);

  // Available options (users from API when not passed)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>(
    usersProp ?? [],
  );
  const [loadingUsers, setLoadingUsers] = useState(!usersProp);
  const [availableCantieri, setAvailableCantieri] = useState<Cantiere[]>([]);
  const [availableMezzi, setAvailableMezzi] = useState<Mezzo[]>([]);

  // Loading states
  const [loadingCantieri, setLoadingCantieri] = useState(false);
  const [loadingMezzi, setLoadingMezzi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users when not passed (e.g. after cleanup of lib/data)
  useEffect(() => {
    if (usersProp !== undefined) return;
    let cancelled = false;
    setLoadingUsers(true);
    fetch("/api/users?notBanned=true&limit=500")
      .then((res) => res.json())
      .then((data: { users?: Array<{ id: string; name: string }> }) => {
        if (!cancelled && Array.isArray(data.users)) setUsers(data.users);
      })
      .finally(() => setLoadingUsers(false));
    return () => {
      cancelled = true;
    };
  }, [usersProp]);

  const fetchUserResources = useCallback(async () => {
    if (!selectedUserId) return;

    setLoadingCantieri(true);
    setLoadingMezzi(true);

    try {
      const [cantieriRes, mezziRes] = await Promise.all([
        fetch(`/api/cantieri?userId=${selectedUserId}&limit=500`),
        fetch(`/api/mezzi?userId=${selectedUserId}&limit=500`),
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
  }, [selectedUserId]);

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

  const addAssenza = (tipo: string, ore: number, minuti: number, note: string) => {
    if (ore < 0 || minuti < 0 || minuti > 59) {
      toast.error("Compila tutti i campi correttamente");
      return;
    }
    setAssenze((prev) => [
      ...prev,
      { localId: crypto.randomUUID(), tipo, ore, minuti, note },
    ]);
  };

  const removeAssenza = (index: number) => {
    setAssenze((prev) => prev.filter((_, i) => i !== index));
  };

  const addTrasporto = (
    cantieriPartenzaId: number,
    cantieriArrivoId: number,
    mezziId: number,
    ore: number,
    minuti: number,
    note: string,
  ) => {
    setTrasporti((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        cantieriPartenzaId,
        cantieriArrivoId,
        mezziId,
        ore,
        minuti,
        note,
      },
    ]);
  };

  const removeTrasporto = (index: number) => {
    setTrasporti((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const hasInterazioni = cantieri.length > 0;
    const hasAssenze = assenze.length > 0;
    const hasTrasporti = trasporti.length > 0;
    if (
      !selectedUserId ||
      !selectedDate ||
      (!hasInterazioni && !hasAssenze && !hasTrasporti)
    ) {
      toast.error(
        "Compila tutti i campi obbligatori e aggiungi almeno un'interazione, un'assenza o un trasporto",
      );
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

    const allAssenze = assenze.map((a) => ({
      tipo: a.tipo,
      ore: a.ore,
      minuti: a.minuti,
      note: a.note,
    }));
    const allTrasporti = trasporti.map((t) => ({
      cantieri_partenza_id: t.cantieriPartenzaId,
      cantieri_arrivo_id: t.cantieriArrivoId,
      mezzi_id: t.mezziId,
      ore: t.ore,
      minuti: t.minuti,
      note: t.note,
    }));

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/attivita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          user_id: selectedUserId,
          interazioni: hasInterazioni ? allInterazioni : [],
          assenze: hasAssenze ? allAssenze : [],
          trasporti: hasTrasporti ? allTrasporti : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nella creazione");
      }
      toast.success("Attività creata con successo!");
      router.push("/admin/attivita");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalHours = () => {
    const interazioniMinutes = cantieri.reduce((total, cantiere) => {
      return (
        total +
        cantiere.interazioni.reduce((cantiereTotal, interazione) => {
          return cantiereTotal + interazione.ore * 60 + interazione.minuti;
        }, 0)
      );
    }, 0);
    const assenzeMinutes = assenze.reduce(
      (total, a) => total + a.ore * 60 + a.minuti,
      0,
    );
    const trasportiMinutes = trasporti.reduce(
      (total, t) => total + t.ore * 60 + t.minuti,
      0,
    );
    const totalMinutes = interazioniMinutes + assenzeMinutes + trasportiMinutes;
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
                  disabled={selectedDate === "" || loadingUsers}
                >
                  <option value="">
                    {loadingUsers ? "Caricamento..." : "Seleziona un operatore"}
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedUserId && (
            <div className="mb-6">
              {/* Sezione Interazioni: plus + titolo, poi tabella direttamente sotto */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AggiungiInterazioneModalForm
                    availableCantieri={availableCantieri}
                    availableMezzi={availableMezzi}
                    loadingCantieri={loadingCantieri}
                    loadingMezzi={loadingMezzi}
                    onAddInterazione={addInterazione}
                  />
                  <h2 className="text-xl font-semibold">Interazioni</h2>
                </div>
                {cantieri.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
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
                                    <TrashIcon className="w-4 h-4" />
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
                                <td className="max-w-[120px] truncate">
                                  {interazione.note || "-"}
                                </td>
                                <td className="hidden md:table-cell">
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
                )}
              </div>

              {/* Sezione Trasporti */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AggiungiTrasportoModalForm
                    availableCantieri={availableCantieri}
                    availableMezzi={availableMezzi}
                    loadingCantieri={loadingCantieri}
                    loadingMezzi={loadingMezzi}
                    onAddTrasporto={addTrasporto}
                  />
                  <h2 className="text-xl font-semibold">Trasporti</h2>
                </div>
                {trasporti.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th className="md:hidden"></th>
                          <th>Partenza</th>
                          <th>Arrivo</th>
                          <th>Mezzo</th>
                          <th>Tempo</th>
                          <th>Note</th>
                          <th className="hidden md:table-cell">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trasporti.map((t, index) => (
                          <tr key={t.localId}>
                            <td className="md:hidden">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => removeTrasporto(index)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="font-medium">
                              {availableCantieri.find((c) => c.id === t.cantieriPartenzaId)?.nome ?? "—"}
                            </td>
                            <td>
                              {availableCantieri.find((c) => c.id === t.cantieriArrivoId)?.nome ?? "—"}
                            </td>
                            <td>
                              {availableMezzi.find((m) => m.id === t.mezziId)?.nome ?? "—"}
                            </td>
                            <td>
                              {t.ore}h {t.minuti}m
                            </td>
                            <td className="max-w-[120px] truncate">{t.note || "-"}</td>
                            <td className="hidden md:table-cell">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => removeTrasporto(index)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sezione Assenze: plus + titolo, poi tabella direttamente sotto */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AggiungiAssenzaModalForm onAddAssenza={addAssenza} />
                  <h2 className="text-xl font-semibold">Assenze</h2>
                </div>
                {assenze.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th className="md:hidden"></th>
                          <th>Tipo</th>
                          <th>Tempo</th>
                          <th className="hidden md:table-cell">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assenze.map((assenza, index) => (
                          <tr key={assenza.localId}>
                            <td className="md:hidden">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => removeAssenza(index)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="font-medium">
                              {ASSENZA_TIPO_LABELS[assenza.tipo] ?? assenza.tipo}
                            </td>
                            <td>
                              {assenza.ore}h {assenza.minuti}m
                            </td>
                            <td className="hidden md:table-cell">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline btn-error"
                                onClick={() => removeAssenza(index)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {(cantieri.length > 0 || assenze.length > 0 || trasporti.length > 0) && (
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Totale ore: </span>
                    <span>
                      {getTotalHours().hours}h{" "}
                      {getTotalHours()
                        .minutes.toString()
                        .padStart(2, "0")}
                      m
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card-actions justify-end">
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => router.push("/admin/attivita")}
            >
              Annulla
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={
                !selectedUserId ||
                !selectedDate ||
                (cantieri.length === 0 && assenze.length === 0 && trasporti.length === 0) ||
                isSubmitting
              }
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-xs" />
              )}
              Crea Attività
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttivitaForm;
