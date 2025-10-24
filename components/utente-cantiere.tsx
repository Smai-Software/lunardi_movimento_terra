"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  addUtenteCantiere,
  removeUtenteCantiere,
} from "@/lib/actions/cantieri.actions";

interface User {
  id: string;
  name: string;
}

interface UserCantiere {
  user_id: string;
  cantieri_id: number;
}

interface UtenteCantiereProps {
  user: User;
  cantiereId: number;
  userCantieri: UserCantiere[];
}

export default function UtenteCantiere({
  user,
  cantiereId,
  userCantieri,
}: UtenteCantiereProps) {
  // Check if user is assigned to this cantiere
  const isAssigned = userCantieri.some(
    (assignment) =>
      assignment.user_id === user.id && assignment.cantieri_id === cantiereId,
  );
  const { execute: executeAssign, isExecuting: isAssigning } = useAction(
    addUtenteCantiere.bind(null, cantiereId, user.id),
    {
      onSuccess: (result) => {
        if (!result.data?.success) {
          toast.error(result.data?.error || "Errore durante l'assegnazione");
        }
      },
      onError: () => {
        toast.error("Errore durante l'assegnazione");
      },
    },
  );

  const { execute: executeRemove, isExecuting: isRemoving } = useAction(
    removeUtenteCantiere.bind(null, cantiereId, user.id),
    {
      onSuccess: (result) => {
        if (!result.data?.success) {
          toast.error(result.data?.error || "Errore durante la rimozione");
        }
      },
      onError: () => {
        toast.error("Errore durante la rimozione");
      },
    },
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
      <div className="ml-4 flex items-center">
        {isLoading && (
          <div className="ml-2">
            <span className="loading loading-spinner loading-sm text-gray-200"></span>
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
