import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import CantiereDetailClient from "@/app/(dashboard)/cantieri/[slug]/cantiere-detail-client";
import CantiereInfoCard from "@/components/cantiere-info-card";
import StatsCardSkeleton from "@/components/stats-card-skeleton";
import TotalHoursCard from "@/components/total-hours-card";
import TotalInterazioniCard from "@/components/total-interazioni-card";
import { auth } from "@/lib/auth";
import { getUserCantieriByCantiereId } from "@/lib/data/cantieri.data";
import {
  getAttivita,
  getInterazioniByCantiereId,
} from "@/lib/data/interazioni.data";
import { getMezzi } from "@/lib/data/mezzi.data";
import { getUsersNotBanned } from "@/lib/data/users.data";
import prisma from "@/lib/prisma";

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

      {/* Statistics Cards with Suspense */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Suspense fallback={<StatsCardSkeleton />}>
          <TotalHoursCard cantieriId={cantiere.id} />
        </Suspense>
        <Suspense fallback={<StatsCardSkeleton />}>
          <TotalInterazioniCard cantieriId={cantiere.id} />
        </Suspense>
      </div>

      {/* Interazioni Section */}
      <CantiereDetailClient
        cantiere={cantiere}
        interazioni={interazioni}
        users={users}
        mezzi={mezzi}
        attivita={attivita}
        userCantieri={userCantieri}
      />
    </div>
  );
}
