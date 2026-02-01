"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import UtenteMezzo from "@/components/utente-mezzo";

interface MezzoLicenze {
  has_license_camion: boolean;
  has_license_escavatore: boolean;
}

interface UserMezzo {
  user_id: string;
  mezzi_id: number;
}

interface UserForMezzo {
  id: string;
  name: string;
  licenseCamion?: boolean | null;
  licenseEscavatore?: boolean | null;
}

interface AssegnaUtenteMezzoModalProps {
  mezzoId: number;
  mezzoNome: string;
  mezzoLicenze: MezzoLicenze;
  users: UserForMezzo[];
  userMezzi: UserMezzo[];
  onSuccess?: () => void;
}

export default function AssegnaUtenteMezzoModal({
  mezzoId,
  mezzoNome,
  mezzoLicenze,
  users: allUsers,
  userMezzi,
  onSuccess,
}: AssegnaUtenteMezzoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [compatibleUsers, setCompatibleUsers] = useState<UserForMezzo[]>([]);
  const [loading, setLoading] = useState(false);

  const filterCompatibleUsers = (
    users: UserForMezzo[],
    licenze: MezzoLicenze,
  ): UserForMezzo[] => {
    return users.filter((user) => {
      // Se il mezzo richiede licenza camion, l'utente deve averla
      if (licenze.has_license_camion && !user.licenseCamion) {
        return false;
      }
      // Se il mezzo richiede licenza escavatore, l'utente deve averla
      if (licenze.has_license_escavatore && !user.licenseEscavatore) {
        return false;
      }
      return true;
    });
  };

  const openModal = async () => {
    setLoading(true);
    try {
      // Filtra gli utenti compatibili lato client
      const compatible = filterCompatibleUsers(allUsers, mezzoLicenze);
      setCompatibleUsers(compatible);
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setCompatibleUsers([]);
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        className="btn btn-outline btn-sm"
        onClick={openModal}
        type="button"
      >
        Assegna
      </button>
      <dialog ref={dialogRef} className="modal" id="assegna-utente-mezzo-modal">
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg mb-4">
            Assegna utenti al mezzo: {mezzoNome}
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Seleziona gli utenti che possono guidare questo mezzo. Solo
                  gli utenti con le licenze appropriate sono mostrati. Le
                  modifiche vengono salvate automaticamente.
                </p>

                {compatibleUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nessun utente compatibile trovato per questo mezzo.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {compatibleUsers.map((user) => (
                      <UtenteMezzo
                        key={user.id}
                        user={{ id: user.id, name: user.name }}
                        mezzoId={mezzoId}
                        userMezzi={userMezzi}
                        onSuccess={onSuccess}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleClose}
                >
                  Chiudi
                </button>
              </div>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button tabIndex={-1} type="submit">
            Annulla
          </button>
        </form>
      </dialog>
    </>
  );
}
