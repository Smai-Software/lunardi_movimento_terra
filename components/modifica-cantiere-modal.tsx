"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { updateCantiere } from "@/lib/actions/cantieri.actions";

type ModificaCantiereModalProps = {
  cantiere: {
    id: number;
    nome: string;
    descrizione: string;
    open: boolean;
  };
  onClose: () => void;
};

export default function ModificaCantiereModal({
  cantiere,
  onClose,
}: ModificaCantiereModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState(cantiere.nome);
  const [descrizione, setDescrizione] = useState(cantiere.descrizione);
  const [open, setOpen] = useState(cantiere.open);

  const { execute, result, reset } = useAction(
    updateCantiere.bind(null, cantiere.id),
    {
      onSuccess: () => {
        if (result.data?.success) {
          toast.success("Cantiere aggiornato con successo!");
          onClose();
        }
      },
    },
  );

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Modifica cantiere</h3>
        <form action={execute}>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`nome-cantiere-${cantiere.id}`}
            >
              Nome
            </label>
            <input
              id={`nome-cantiere-${cantiere.id}`}
              className="input input-bordered w-full"
              type="text"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Inserisci il nome"
            />
          </div>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`descrizione-cantiere-${cantiere.id}`}
            >
              Descrizione
            </label>
            <textarea
              id={`descrizione-cantiere-${cantiere.id}`}
              className="textarea textarea-bordered w-full"
              name="descrizione"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Inserisci la descrizione"
            />
          </div>
          <div className="mb-4">
            <label
              className="block font-medium mb-1 text-sm"
              htmlFor={`open-cantiere-${cantiere.id}`}
            >
              Stato cantiere
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`open-cantiere-${cantiere.id}`}
                className="toggle toggle-success"
                type="checkbox"
                name="open"
                checked={open}
                onChange={(e) => setOpen(e.target.checked)}
              />
              <span className="text-sm">{open ? "Aperto" : "Chiuso"}</span>
            </div>
          </div>
          <ValidationErrors result={result} />
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
            >
              Annulla
            </button>
            <SubmitButton className="btn btn-primary">
              Salva modifiche
            </SubmitButton>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button tabIndex={-1} type="submit">
          Annulla
        </button>
      </form>
    </dialog>
  );
}
