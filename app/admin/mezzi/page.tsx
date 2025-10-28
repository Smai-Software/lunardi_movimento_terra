import { CheckIcon, XIcon } from "lucide-react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import AggiungiMezzoModal from "@/components/aggiungi-mezzo-modal";
import AssegnaUtenteMezzoModal from "@/components/assegna-utente-mezzo-modal";
import EliminaMezzoModal from "@/components/elimina-mezzo-modal";
import ModificaMezzoModal from "@/components/modifica-mezzo-modal";
import { auth } from "@/lib/auth";
import { getMezzi } from "@/lib/data/mezzi.data";
import { getUsersNotBanned } from "@/lib/data/users.data";

export default async function MezziPage() {
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

  const [mezziData, usersData] = await Promise.all([
    getMezzi(),
    getUsersNotBanned(),
  ]);

  return (
    <div className="mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mezzi</h1>
        <AggiungiMezzoModal />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table">
          <thead className="bg-base-200">
            <tr>
              <th>Nome</th>
              <th>Descrizione</th>
              <th>Patente Camion</th>
              <th>Patente Escavatore</th>
              <th>N. Operatori</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {mezziData.map((mezzo) => (
              <tr key={mezzo.id}>
                <td>{mezzo.nome}</td>
                <td>{mezzo.descrizione}</td>
                <td>
                  {mezzo.has_license_camion ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <XIcon className="w-4 h-4" />
                  )}
                </td>
                <td>
                  {mezzo.has_license_escavatore ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <XIcon className="w-4 h-4" />
                  )}
                </td>
                <td>
                  <span className="font-medium">
                    {mezzo.user_mezzi?.length || 0}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <AssegnaUtenteMezzoModal
                      mezzoId={mezzo.id}
                      mezzoNome={mezzo.nome}
                      mezzoLicenze={{
                        has_license_camion: mezzo.has_license_camion,
                        has_license_escavatore: mezzo.has_license_escavatore,
                      }}
                      users={usersData}
                      userMezzi={mezzo.user_mezzi}
                    />
                    <ModificaMezzoModal
                      mezzo={{
                        id: mezzo.id,
                        nome: mezzo.nome,
                        descrizione: mezzo.descrizione,
                        has_license_camion: mezzo.has_license_camion,
                        has_license_escavatore: mezzo.has_license_escavatore,
                      }}
                    />
                    <EliminaMezzoModal
                      mezzo={{ id: mezzo.id, nome: mezzo.nome }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
