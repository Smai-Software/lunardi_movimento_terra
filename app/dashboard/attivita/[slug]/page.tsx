import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import UserAttivitaDetailPageClient from "./attivita-detail-page-client";

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

  if (session.user.role !== "user") {
    redirect("/admin");
  }

  const userId = session.user.id;

  return <UserAttivitaDetailPageClient slug={slug} userId={userId} />;
}
