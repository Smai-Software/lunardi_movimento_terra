import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import UserAttivitaDetailPageClient from "./attivita-detail-page-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AttivitaDetailPage({ params }: PageProps) {
  const [session, resolvedParams] = await Promise.all([
    getSession(),
    params,
  ]);
  const { slug } = resolvedParams;

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "user") {
    redirect("/admin");
  }

  const userId = session.user.id;

  return <UserAttivitaDetailPageClient slug={slug} userId={userId} />;
}
