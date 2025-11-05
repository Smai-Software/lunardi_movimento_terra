import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import CantiereInfoCard from "@/components/cantiere-info-card";
import StatsCardSkeleton from "@/components/stats-card-skeleton";
import TotalHoursCard from "@/components/total-hours-card";
import TotalInterazioniCard from "@/components/total-interazioni-card";
import { auth } from "@/lib/auth";
import { getUserCantieriByCantiereId } from "@/lib/data/cantieri.data";
import { getInterazioniByCantiereId } from "@/lib/data/interazioni.data";
import { getAttivita } from "@/lib/data/attivita.data";
import { getMezzi } from "@/lib/data/mezzi.data";
import { getUsersNotBanned } from "@/lib/data/users.data";
import prisma from "@/lib/prisma";
import AssegnaUtenteCantiereModal from "@/components/assegna-utente-cantiere-modal";
import { UserIcon } from "lucide-react";
import InterazioniTable from "@/components/interazioni-table";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CantiereDetailPage({ params }: PageProps) {
  const { slug } = await params;

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

  // Fetch cantiere by external_id
  const cantiere = await prisma.cantieri.findUnique({
    where: {
      external_id: slug,
    },
    select: {
      id: true,
      nome: true,
      descrizione: true,
      open: true,
      closed_at: true,
      external_id: true,
      created_at: true,
      last_update_at: true,
      created_by: true,
      last_update_by: true,
      user_cantieri_created_byTouser: {
        select: {
          id: true,
          name: true,
        },
      },
      user_cantieri_last_update_byTouser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!cantiere) {
    notFound();
  }

  // Fetch related data
  const [interazioni, users, mezzi, attivita, userCantieri] = await Promise.all(
    [
      getInterazioniByCantiereId(cantiere.id),
      getUsersNotBanned(),
      getMezzi(),
      getAttivita(),
      getUserCantieriByCantiereId(cantiere.id),
    ],
  );

  return (
    <div className="mx-auto px-6 py-8">
      {/* Cantiere Info Card with Edit/Delete Buttons */}
      <CantiereInfoCard cantiere={cantiere} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-base-100 border border-gray-200">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Utenti Assegnati</h2>
              <AssegnaUtenteCantiereModal
                cantiereId={cantiere.id}
                cantiereNome={cantiere.nome}
                users={users}
                userCantieri={userCantieri.map((uc) => ({
                  user_id: uc.user_id,
                  cantieri_id: uc.cantieri_id,
                }))}
              />
            </div>
            <div className="mb-4">
              {userCantieri.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userCantieri.map((userCantiere) => (
                    <div
                      key={userCantiere.id}
                      className="card bg-base-100 shadow-sm border border-gray-200"
                    >
                      <div className="card-body p-4">
                        <h3 className="card-title text-sm flex items-center">
                          <UserIcon className="w-4 h-4" />{" "}
                          {userCantiere.user.name}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <p>Nessun utente assegnato a questo cantiere.</p>
                  <p className="text-sm mt-2">
                    Clicca su "Gestisci Utenti" per assegnare utenti.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 mb-8">
          <Suspense fallback={<StatsCardSkeleton />}>
            <TotalHoursCard cantieriId={cantiere.id} />
          </Suspense>
          <Suspense fallback={<StatsCardSkeleton />}>
            <TotalInterazioniCard cantieriId={cantiere.id} />
          </Suspense>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Interazioni</h2>
      </div>

      {/* Interazioni Table */}
      <InterazioniTable
        interazioni={interazioni}
        users={users}
        mezzi={mezzi}
        attivita={attivita}
      />
    </div>
  );
}
