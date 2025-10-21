"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { ValidationErrors } from "@/components/validation-errors";
import { createCantiere } from "@/lib/actions/cantieri.actions";

export default function AggiungiCantiereModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [open, setOpen] = useState(true);

  const { execute, result, reset } = useAction(createCantiere, {
    onSuccess: () => {
      if (result.data?.success) {
        toast.success("Cantiere creato con successo!");
        handleClose();
      }
    },
  });

  const openModal = () => {
    reset();
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setNome("");
    setDescrizione("");
    setOpen(true);
    reset();
    dialogRef.current?.close();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={openModal} type="button">
        Aggiungi cantiere
      </button>
      <dialog ref={dialogRef} className="modal" id="aggiungi-cantiere-modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Aggiungi nuovo cantiere</h3>
          <form action={execute}>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="nome-cantiere"
              >
                Nome
              </label>
              <input
                id="nome-cantiere"
                className="input input-bordered w-full"
                type="text"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Inserisci il nome"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="descrizione-cantiere"
              >
                Descrizione
              </label>
              <input
                id="descrizione-cantiere"
                className="input input-bordered w-full"
                type="text"
                name="descrizione"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Inserisci la descrizione"
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block font-medium mb-1 text-sm"
                htmlFor="open-cantiere"
              >
                Stato cantiere
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="open-cantiere"
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
                Crea cantiere
              </SubmitButton>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" tabIndex={-1}>
            Annulla
          </button>
        </form>
      </dialog>
    </>
  );
}
