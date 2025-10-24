"use client";

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h1 className="text-2xl">{cantiere.nome}</h1>
        </div>
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            {cantiere.open ? (
              <span className="badge badge-success">Aperto</span>
            ) : (
              <span className="badge badge-error">Chiuso</span>
            )}
          </div>
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
          />
        )}
      </div>
      <p className="text-base-content/70 mb-4">{cantiere.descrizione}</p>
    </>
  );
}
