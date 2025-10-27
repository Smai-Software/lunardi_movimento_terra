import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import AttivitaDetailClient from "@/app/(dashboard)/attivita/[slug]/attivita-detail-client";
import AttivitaInfoCard from "@/components/attivita-info-card";
import StatsCardSkeleton from "@/components/stats-card-skeleton";
import TotalHoursCardAttivita from "@/components/total-hours-card-attivita";
import TotalInterazioniCardAttivita from "@/components/total-interazioni-card-attivita";
import { auth } from "@/lib/auth";
import {
  getAttivitaByExternalId,
  getInterazioniByAttivitaId,
} from "@/lib/data/attivita.data";
import { getCantieriByUserId } from "@/lib/data/cantieri.data";
import { getMezzi } from "@/lib/data/mezzi.data";
import { getUsersNotBanned } from "@/lib/data/users.data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AttivitaDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch attivita by external_id
  const attivita = await getAttivitaByExternalId(slug);

  if (!attivita) {
    notFound();
  }

  // Fetch related data
  const [interazioni, users, mezzi, cantieri] = await Promise.all([
    getInterazioniByAttivitaId(attivita.id),
    getUsersNotBanned(),
    getMezzi(),
    getCantieriByUserId(attivita.user_id),
  ]);

  // Map cantieri to match expected format for the modal
  const cantieriForModal = cantieri.map((c) => ({
    id: c.id,
    nome: c.nome,
  }));

  return (
    <div className="mx-auto px-6 py-8">
      {/* Attività Info Card with Edit/Delete Buttons */}
      <AttivitaInfoCard attivita={attivita} />

      {/* Statistics Cards with Suspense */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Suspense fallback={<StatsCardSkeleton />}>
          <TotalHoursCardAttivita attivitaId={attivita.id} />
        </Suspense>
        <Suspense fallback={<StatsCardSkeleton />}>
          <TotalInterazioniCardAttivita attivitaId={attivita.id} />
        </Suspense>
      </div>

      {/* Interazioni Section */}
      <AttivitaDetailClient
        attivita={attivita}
        interazioni={interazioni}
        users={users}
        mezzi={mezzi}
        cantieri={cantieriForModal}
      />
    </div>
  );
}
