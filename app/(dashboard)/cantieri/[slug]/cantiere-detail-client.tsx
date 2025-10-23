"use client";

import AssegnaUtenteCantiereModal from "@/components/assegna-utente-cantiere-modal";
import InterazioniTable from "@/components/interazioni-table";
import type { UserCantieri } from "@/lib/data/cantieri.data";
import type { InterazioneAll } from "@/lib/data/interazioni.data";
import type { UserNotBanned } from "@/lib/data/users.data";

type CantiereDetailClientProps = {
  cantiere: {
    id: number;
    nome: string;
    descrizione: string;
    open: boolean;
    closed_at: Date | null;
    external_id: string;
    created_at: Date;
    last_update_at: Date;
    created_by: string;
    last_update_by: string;
    user_cantieri_created_byTouser: {
      id: string;
      name: string;
    };
    user_cantieri_last_update_byTouser: {
      id: string;
      name: string;
    };
  };
  interazioni: InterazioneAll[];
  users: UserNotBanned[];
  mezzi: Array<{ id: number; nome: string }>;
  attivita: Array<{ id: number; date: Date }>;
  userCantieri: UserCantieri[];
};

export default function CantiereDetailClient({
  cantiere,
  interazioni,
  users,
  mezzi,
  attivita,
  userCantieri,
}: CantiereDetailClientProps) {
  return (
    <>
      {/* Assigned Users Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Utenti Assegnati</h2>
          <AssegnaUtenteCantiereModal
            cantiereId={cantiere.id}
            cantiereNome={cantiere.nome}
            users={users}
            userCantieri={userCantieri.map((uc) => ({
              user_id: uc.user_id,
              cantieri_id: uc.cantieri_id,
            }))}
          />
        </div>

        {userCantieri.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCantieri.map((userCantiere) => (
              <div
                key={userCantiere.id}
                className="card bg-base-100 shadow-sm border border-gray-200"
              >
                <div className="card-body p-4">
                  <h3 className="card-title text-sm">
                    {userCantiere.user.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Assegnato il{" "}
                    {new Date(userCantiere.created_at).toLocaleDateString(
                      "it-IT",
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <p>Nessun utente assegnato a questo cantiere.</p>
            <p className="text-sm mt-2">
              Clicca su "Gestisci Utenti" per assegnare utenti.
            </p>
          </div>
        )}
      </div>

      {/* Interazioni Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Interazioni</h2>
      </div>

      {/* Interazioni Table */}
      <InterazioniTable
        interazioni={interazioni}
        users={users}
        mezzi={mezzi}
        attivita={attivita}
      />
    </>
  );
}
