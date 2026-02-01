"use client";

import { useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
}

interface UserMezzo {
  user_id: string;
  mezzi_id: number;
}

interface UtenteMezzoProps {
  user: User;
  mezzoId: number;
  userMezzi: UserMezzo[];
  onSuccess?: () => void;
}

export default function UtenteMezzo({
  user,
  mezzoId,
  userMezzi,
  onSuccess,
}: UtenteMezzoProps) {
  const isAssigned = userMezzi.some(
    (assignment) =>
      assignment.user_id === user.id && assignment.mezzi_id === mezzoId,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckboxChange = async (checked: boolean) => {
    setIsLoading(true);
    try {
      if (checked) {
        const res = await fetch(`/api/mezzi/${mezzoId}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error((data as { error?: string }).error || "Errore durante l'assegnazione");
          return;
        }
        toast.success("Utente assegnato con successo");
      } else {
        const res = await fetch(
          `/api/mezzi/${mezzoId}/users?userId=${encodeURIComponent(user.id)}`,
          { method: "DELETE" },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error((data as { error?: string }).error || "Errore durante la rimozione");
          return;
        }
        toast.success("Utente rimosso con successo");
      }
      onSuccess?.();
    } catch {
      toast.error("Errore di rete");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="font-medium">{user.name}</div>
      </div>
      <div className="ml-4 flex items-center">
        {isLoading && (
          <div className="ml-2">
            <span className="loading loading-spinner loading-sm text-gray-200" />
          </div>
        )}
        <input
          type="checkbox"
          className="toggle toggle-success"
          checked={isAssigned}
          disabled={isLoading}
          onChange={(e) => {
            handleCheckboxChange(e.target.checked);
          }}
        />
      </div>
    </div>
  );
}
