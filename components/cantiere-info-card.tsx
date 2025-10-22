"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import EliminaCantiereModal from "@/components/elimina-cantiere-modal";
import ModificaCantiereModal from "@/components/modifica-cantiere-modal";

type CantiereInfoCardProps = {
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
};

export default function CantiereInfoCard({ cantiere }: CantiereInfoCardProps) {
  const [showModificaCantiere, setShowModificaCantiere] = useState(false);
  const [showEliminaCantiere, setShowEliminaCantiere] = useState(false);

  return (
    <>
      {/* Cantiere Info Card */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h1 className="card-title text-3xl">{cantiere.nome}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {cantiere.open ? (
                  <>
                    <CheckIcon className="w-5 h-5 text-success" />
                    <span className="text-success font-medium">Aperto</span>
                  </>
                ) : (
                  <>
                    <XIcon className="w-5 h-5 text-error" />
                    <span className="text-error font-medium">Chiuso</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowModificaCantiere(true)}
                >
                  Modifica Cantiere
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-error btn-sm"
                  onClick={() => setShowEliminaCantiere(true)}
                >
                  Elimina Cantiere
                </button>
              </div>
            </div>
          </div>

          <p className="text-base-content/70 mb-4">{cantiere.descrizione}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Creato da:</span>{" "}
              {cantiere.user_cantieri_created_byTouser.name}
            </div>
            <div>
              <span className="font-medium">Data creazione:</span>{" "}
              {new Date(cantiere.created_at).toLocaleDateString("it-IT")}
            </div>
            <div>
              <span className="font-medium">Ultima modifica:</span>{" "}
              {cantiere.user_cantieri_last_update_byTouser.name}
            </div>
            <div>
              <span className="font-medium">Data ultima modifica:</span>{" "}
              {new Date(cantiere.last_update_at).toLocaleDateString("it-IT")}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModificaCantiere && (
        <ModificaCantiereModal
          cantiere={{
            id: cantiere.id,
            nome: cantiere.nome,
            descrizione: cantiere.descrizione,
            open: cantiere.open,
          }}
          onClose={() => setShowModificaCantiere(false)}
        />
      )}

      {showEliminaCantiere && (
        <EliminaCantiereModal
          cantiere={{
            id: cantiere.id,
            nome: cantiere.nome,
          }}
          onClose={() => setShowEliminaCantiere(false)}
        />
      )}
    </>
  );
}
