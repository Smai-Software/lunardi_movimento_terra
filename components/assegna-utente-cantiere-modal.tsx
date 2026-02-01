"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import UtenteCantiere from "@/components/utente-cantiere";

interface UserCantiere {
  user_id: string;
  cantieri_id: number;
}

interface AssegnaUtenteCantiereModalProps {
  cantiereId: number;
  cantiereNome: string;
  users: Array<{ id: string; name: string }>;
  userCantieri: UserCantiere[];
  onSuccess?: () => void;
}

export default function AssegnaUtenteCantiereModal({
  cantiereId,
  cantiereNome,
  users: allUsers,
  userCantieri,
  onSuccess,
}: AssegnaUtenteCantiereModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [filteredUsers, setFilteredUsers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const openModal = async () => {
    setLoading(true);
    try {
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setFilteredUsers([]);
    setSearchTerm("");
    dialogRef.current?.close();
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter((user) =>
        user.name.toLowerCase().includes(term.toLowerCase()),
      );
      setFilteredUsers(filtered);
    }
  };

  return (
    <>
      <button
        className="btn btn-outline btn-sm"
        onClick={openModal}
        type="button"
      >
        Gestisci Utenti
      </button>
      <dialog
        ref={dialogRef}
        className="modal"
        id="assegna-utente-cantiere-modal"
      >
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg mb-4">
            Gestisci utenti assegnati al cantiere: {cantiereNome}
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Seleziona gli utenti da assegnare a questo cantiere. Le
                  modifiche vengono salvate automaticamente.
                </p>

                {/* Search Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Cerca utenti..."
                    className="input input-bordered w-full"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? "Nessun utente trovato per la ricerca."
                      : "Nessun utente disponibile."}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <UtenteCantiere
                        key={user.id}
                        user={user}
                        cantiereId={cantiereId}
                        userCantieri={userCantieri}
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
