"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";

type EliminaCantiereModalProps = {
  cantiere: {
    id: number;
    nome: string;
  };
  triggerLabel?: React.ReactNode;
  onSuccess?: () => void;
};

export default function EliminaCantiereModal({
  cantiere,
  triggerLabel = "Elimina Cantiere",
  onSuccess,
}: EliminaCantiereModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const openModal = () => {
    setError(null);
    dialogRef.current?.showModal();
  };

  const handleClose = () => {
    setError(null);
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cantieri/${cantiere.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Errore nell'eliminazione");
      }
      toast.success("Cantiere eliminato con successo!");
      handleClose();
      mutate((key) => typeof key === "string" && key.startsWith("/api/cantieri"));
      onSuccess?.();
      router.push("/admin/cantieri");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-outline btn-error btn-sm"
        onClick={openModal}
      >
        {triggerLabel}
      </button>
      <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Conferma eliminazione</h3>
        <form onSubmit={handleSubmit}>
          <p className="mb-3">
            Sei sicuro di voler eliminare &quot;{cantiere.nome}&quot;?
          </p>
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-error"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Elimina cantiere"
              )}
            </button>
          </div>
        </form>
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
