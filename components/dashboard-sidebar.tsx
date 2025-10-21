"use client";

import {
  CalendarSearch,
  Car,
  FileText,
  Home,
  IdCard,
  MapPin,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function DashboardSidebar() {
  const { data: session } = useSession();

  const role = session?.user?.role;
  const isAdmin = role === "admin";

  return (
    <ul className="menu bg-base-200 text-base-content min-h-full w-fit p-4 space-y-2 text-base">
      <li className="font-semibold">L.M.T</li>
      <li>
        <Link href="/" className="hover:bg-base-300 rounded-md mt-8">
          <Home className="size-6" /> Dashboard
        </Link>
      </li>
      {isAdmin && (
        <>
          <li>
            <Link href="/ordini" className="hover:bg-base-300 rounded-md">
              <CalendarSearch className="size-6" /> Ordini
            </Link>
          </li>
          <li>
            <Link href="/timbrature" className="hover:bg-base-300 rounded-md">
              <IdCard className="size-6" /> Timbrature
            </Link>
          </li>
          <li>
            <Link href="/utenti" className="hover:bg-base-300 rounded-md">
              <Users className="size-6" /> Utenti
            </Link>
          </li>
          <div className="divider"></div>
          <li>
            <Link href="/attivita" className="hover:bg-base-300 rounded-md">
              <FileText className="size-6" /> Attività
            </Link>
          </li>
          <li>
            <Link href="/attrezzature" className="hover:bg-base-300 rounded-md">
              <Wrench className="size-6" /> Attrezzature
            </Link>
          </li>
          <li>
            <Link href="/localita" className="hover:bg-base-300 rounded-md">
              <MapPin className="size-6" /> Località
            </Link>
          </li>
          <li>
            <Link href="/mezzi" className="hover:bg-base-300 rounded-md">
              <Car className="size-6" /> Mezzi
            </Link>
          </li>
        </>
      )}
    </ul>
  );
}
