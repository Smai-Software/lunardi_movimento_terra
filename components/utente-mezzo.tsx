"use client";

import React from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { addUtenteMezzo, removeUtenteMezzo } from "@/lib/actions/mezzi.actions";

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
}

export default function UtenteMezzo({
  user,
  mezzoId,
  userMezzi,
}: UtenteMezzoProps) {
  // Check if user is assigned to this mezzo
  const isAssigned = userMezzi.some(
    (assignment) =>
      assignment.user_id === user.id && assignment.mezzi_id === mezzoId
  );
  const { execute: executeAssign, isExecuting: isAssigning } = useAction(
    addUtenteMezzo.bind(null, mezzoId, user.id),
    {
      onSuccess: (result) => {
        if (result.data?.success) {
          toast.success(`${user.name} assegnato al mezzo`);
        } else {
          toast.error(result.data?.error || "Errore durante l'assegnazione");
        }
      },
      onError: () => {
        toast.error("Errore durante l'assegnazione");
      },
    }
  );

  const { execute: executeRemove, isExecuting: isRemoving } = useAction(
    removeUtenteMezzo.bind(null, mezzoId, user.id),
    {
      onSuccess: (result) => {
        if (result.data?.success) {
          toast.success(`${user.name} rimosso dal mezzo`);
        } else {
          toast.error(result.data?.error || "Errore durante la rimozione");
        }
      },
      onError: () => {
        toast.error("Errore durante la rimozione");
      },
    }
  );

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      executeAssign();
    } else {
      executeRemove();
    }
  };

  const isLoading = isAssigning || isRemoving;

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="font-medium">{user.name}</div>
      </div>
      <div className="ml-4">
        <input
          type="checkbox"
          className="toggle toggle-success"
          checked={isAssigned}
          disabled={isLoading}
          onChange={(e) => {
            handleCheckboxChange(e.target.checked);
          }}
        />
        {isLoading && (
          <div className="ml-2">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}
      </div>
    </div>
  );
}
