"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AggiungiAssenzaModalForm from "@/components/aggiungi-assenza-modal-form";
import AggiungiInterazioneModalForm from "@/components/aggiungi-interazione-modal-form";
import AggiungiTrasportoModalForm from "@/components/aggiungi-trasporto-modal-form";
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
  attrezzaturaId: number | null;
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
  mezziTrasportatoId: number | null;
  attrezzaturaId: number | null;
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

type UserAttivitaFormProps = {
  userId: string;
};

function UserAttivitaForm({ userId }: UserAttivitaFormProps) {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [cantieri, setCantieri] = useState<CantiereWithInterazioni[]>([]);
  const [assenze, setAssenze] = useState<Assenza[]>([]);
  const [trasporti, setTrasporti] = useState<Trasporto[]>([]);

  const [availableCantieri, setAvailableCantieri] = useState<Cantiere[]>([]);
  const [availableMezzi, setAvailableMezzi] = useState<Mezzo[]>([]);
  const [availableAttrezzature, setAvailableAttrezzature] = useState<Array<{ id: number; nome: string }>>([]);
  const [availableMezziCamion, setAvailableMezziCamion] = useState<Mezzo[]>([]);
  const [availableMezziEscavatore, setAvailableMezziEscavatore] = useState<Mezzo[]>([]);

  const [loadingCantieri, setLoadingCantieri] = useState(false);
  const [loadingMezzi, setLoadingMezzi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserResources = useCallback(async () => {
    setLoadingCantieri(true);
    setLoadingMezzi(true);

    try {
      const [cantieriRes, mezziRes, mezziCamionRes, mezziEscavatoreRes, attrezzatureRes] = await Promise.all([
        fetch(`/api/cantieri?userId=${userId}&limit=500`),
        fetch(`/api/mezzi?userId=${userId}&limit=500`),
        fetch(
          `/api/mezzi?userId=${userId}&limit=500&has_license_camion=true`,
        ),
        fetch(
          `/api/mezzi?userId=${userId}&limit=500&has_license_escavatore=true`,
        ),
        fetch("/api/attrezzature?limit=500"),
      ]);

      const cantieriData = await cantieriRes.json().catch(() => ({}));
      const mezziData = await mezziRes.json().catch(() => ({}));
      const mezziCamionData = await mezziCamionRes.json().catch(() => ({}));
      const mezziEscavatoreData = await mezziEscavatoreRes.json().catch(() => ({}));
      const attrezzatureData = await attrezzatureRes.json().catch(() => ({}));

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

      if (mezziCamionRes.ok && Array.isArray(mezziCamionData.mezzi)) {
        setAvailableMezziCamion(mezziCamionData.mezzi);
      } else if (!mezziCamionRes.ok) {
        toast.error(
          (mezziCamionData as { error?: string }).error ||
            "Errore nel caricamento dei mezzi camion",
        );
      }

      if (mezziEscavatoreRes.ok && Array.isArray(mezziEscavatoreData.mezzi)) {
        setAvailableMezziEscavatore(mezziEscavatoreData.mezzi);
      } else if (!mezziEscavatoreRes.ok) {
        toast.error(
          (mezziEscavatoreData as { error?: string }).error ||
            "Errore nel caricamento dei mezzi escavatore",
        );
      }

      if (attrezzatureRes.ok && Array.isArray(attrezzatureData.attrezzature)) {
        setAvailableAttrezzature(attrezzatureData.attrezzature);
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
      setAvailableAttrezzature([]);
      setAvailableMezziCamion([]);
      setAvailableMezziEscavatore([]);
    }
  }, [userId, fetchUserResources]);

  const addInterazione = (
    cantiereId: number,
    mezziId: number | null,
    attrezzaturaId: number | null,
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
      attrezzaturaId,
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
    mezziTrasportatoId?: number | null,
    attrezzaturaId?: number | null,
  ) => {
    setTrasporti((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        cantieriPartenzaId,
        cantieriArrivoId,
        mezziId,
        mezziTrasportatoId: mezziTrasportatoId ?? null,
        attrezzaturaId: attrezzaturaId ?? null,
        ore,
        minuti,
        note,
      },
    ]);
  };

  const removeTrasporto = (index: number) => {
    setTrasporti((prev) => prev.filter((_, i) => i !== index));
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
    const hasInterazioni = cantieri.length > 0;
    const hasAssenze = assenze.length > 0;
    const hasTrasporti = trasporti.length > 0;
    if (!selectedDate || (!hasInterazioni && !hasAssenze && !hasTrasporti)) {
      toast.error(
        "Compila tutti i campi obbligatori e aggiungi almeno un'interazione, un'assenza o un trasporto",
      );
      return;
    }
    if (selectedDate > getTodayLocalDateString()) {
      toast.error(
        "Operazione non consentita: puoi modificare/eliminare solo attività degli ultimi 7 giorni. Contatta l'amministrazione.",
      );
      return;
    }
    if (selectedDate < getMinDateString()) {
      toast.error(
        "Operazione non consentita: puoi modificare/eliminare solo attività degli ultimi 7 giorni. Contatta l'amministrazione.",
      );
      return;
    }

    const allInterazioni = cantieri.flatMap((cantiere) =>
      cantiere.interazioni.map((interazione) => ({
        cantieri_id: cantiere.cantiereId,
        mezzi_id: interazione.mezziId,
        attrezzature_id: interazione.attrezzaturaId,
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
      mezzi_trasportato_id: t.mezziTrasportatoId ?? null,
      attrezzature_id: t.attrezzaturaId ?? null,
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
          user_id: userId,
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
      router.push("/dashboard?tab=list");
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
                  min={getMinDateString()}
                  max={getTodayLocalDateString()}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            {/* Sezione Interazioni: plus + titolo, poi tabella direttamente sotto */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AggiungiInterazioneModalForm
                    availableCantieri={availableCantieri}
                    availableMezzi={availableMezzi}
                    availableAttrezzature={availableAttrezzature}
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
                        <th>Cantiere</th>
                        <th>Mezzo</th>
                        <th>Attrezzatura</th>
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
                                {interazione.attrezzaturaId
                                  ? availableAttrezzature.find(
                                      (a) => a.id === interazione.attrezzaturaId,
                                    )?.nome ?? "N/A"
                                  : "Nessuna"}
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
              )}
            </div>

            {/* Sezione Trasporti */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AggiungiTrasportoModalForm
                  availableCantieri={availableCantieri}
                  availableMezziCamion={availableMezziCamion}
                  availableMezziEscavatore={availableMezziEscavatore}
                  availableAttrezzature={availableAttrezzature}
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
                        <th>Partenza</th>
                        <th>Arrivo</th>
                        <th>Mezzo</th>
                        <th>Attrezzatura</th>
                        <th>Tempo</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trasporti.map((t, index) => (
                        <tr key={t.localId}>
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
                            {t.attrezzaturaId != null
                              ? availableAttrezzature.find((a) => a.id === t.attrezzaturaId)?.nome ?? "—"
                              : "—"}
                          </td>
                          <td>
                            {t.ore}h {t.minuti}m
                          </td>
                          <td>
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

            {/* Sezione Assenze */}
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
                        <th>Tipo</th>
                        <th>Tempo</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assenze.map((assenza, index) => (
                        <tr key={assenza.localId}>
                          <td className="font-medium">
                            {ASSENZA_TIPO_LABELS[assenza.tipo] ?? assenza.tipo}
                          </td>
                          <td>
                            {assenza.ore}h {assenza.minuti}m
                          </td>
                          <td>
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
              <div className="mt-4">
                <div className="card bg-primary text-primary-content">
                  <div className="card-body py-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Totale ore: </span>
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
              disabled={
                !selectedDate ||
                (cantieri.length === 0 && assenze.length === 0 && trasporti.length === 0) ||
                isSubmitting
              }
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
