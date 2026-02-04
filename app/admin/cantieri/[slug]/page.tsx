import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CantiereDetailPageClient from "./cantiere-detail-page-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CantiereDetailPage({ params }: PageProps) {
  const [session, resolvedParams] = await Promise.all([
    getSession(),
    params,
  ]);
  const { slug } = resolvedParams;

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  return <CantiereDetailPageClient slug={slug} />;
}
