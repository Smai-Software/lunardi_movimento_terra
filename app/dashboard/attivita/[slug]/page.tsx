import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import AttivitaInfoCard from "@/components/attivita-info-card";
import StatsCardSkeleton from "@/components/stats-card-skeleton";
import TotalHoursCardAttivita from "@/components/total-hours-card-attivita";
import TotalInterazioniCardAttivita from "@/components/total-interazioni-card-attivita";
import InterazioniTableAttivita from "@/components/interazioni-table-attivita";
import { auth } from "@/lib/auth";
import {
  getAttivitaByExternalId,
  getInterazioniByAttivitaId,
} from "@/lib/data/attivita.data";
import { getMezzi } from "@/lib/data/mezzi.data";

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

  // Check if user has user role
  if (session.user.role !== "user") {
    redirect("/admin");
  }

  // Fetch attivita by external_id
  const attivita = await getAttivitaByExternalId(slug);

  if (!attivita) {
    notFound();
  }

  // Check that the activity belongs to the logged-in user
  if (attivita.user_id !== session.user.id) {
    notFound();
  }

  // Fetch related data
  const [interazioni, mezzi] = await Promise.all([
    getInterazioniByAttivitaId(attivita.id),
    getMezzi(),
  ]);

  return (
    <div className="mx-auto px-6 py-8">
      {/* Back button */}
      <div className="mb-4">
        <a href="/dashboard?tab=list" className="btn btn-sm btn-ghost">
          ← Torna alle attività
        </a>
      </div>

      {/* Attività Info Card */}
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
      <div className="card bg-base-100 shadow-xl border border-gray-200">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-4">Interazioni</h2>
          <InterazioniTableAttivita interazioni={interazioni} mezzi={mezzi} />
        </div>
      </div>
    </div>
  );
}
