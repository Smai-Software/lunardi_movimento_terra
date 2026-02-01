import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CantiereDetailPageClient from "./cantiere-detail-page-client";

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

  if (session.user.role !== "admin") {
    notFound();
  }

  return <CantiereDetailPageClient slug={slug} />;
}
