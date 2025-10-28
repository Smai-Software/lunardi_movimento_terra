import { CheckIcon, XIcon } from "lucide-react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AggiungiUtenteModal from "@/components/aggiungi-utente-modal";
import BanUserDialog from "@/components/ban-user-dialog";
import ModificaUtenteModal from "@/components/modifica-utente-modal";
import { auth } from "@/lib/auth";
import { getUsers } from "@/lib/data/users.data";

export default async function UtentiPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user has admin role
  if (session.user.role !== "admin") {
    notFound();
  }

  const users = await getUsers();

  return (
    <div className="mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Utenti</h1>
        <AggiungiUtenteModal />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table">
          <thead className="bg-base-200">
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Patente Camion</th>
              <th>Patente Escavatore</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = session.user?.id === user.id;
              const isBanned = Boolean(user.banned);

              return (
                <tr key={user.id}>
                  <td>{user.name ?? ""}</td>
                  <td>{user.email}</td>
                  <td>{user.phone ?? ""}</td>
                  <td>
                    {user.licenseCamion ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <XIcon className="w-4 h-4" />
                    )}
                  </td>
                  <td>
                    {user.licenseEscavatore ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      <XIcon className="w-4 h-4" />
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${isBanned ? "badge-error" : "badge-success"}`}
                    >
                      {isBanned ? "Bloccato" : "Attivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <ModificaUtenteModal
                        utente={{
                          id: user.id,
                          name: user.name,
                          phone: user.phone,
                          licenseCamion: user.licenseCamion,
                          licenseEscavatore: user.licenseEscavatore,
                        }}
                      />
                      {!isCurrentUser && (
                        <BanUserDialog
                          user={{
                            id: user.id,
                            name: user.name,
                            banned: user.banned,
                          }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
