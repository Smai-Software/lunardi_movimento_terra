import CurrentUserName from "@/components/current-username";
import SignOut from "@/components/logout-form";
import { Building2, FileText, Home, Menu, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="drawer lg:drawer-open">
        <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          <div className="navbar bg-base-100 shadow-sm">
            <div className="flex-none lg:hidden">
              <label
                htmlFor="my-drawer-2"
                className="btn btn-square btn-ghost drawer-button"
              >
                <Menu className="size-6" />
              </label>
            </div>
            <div className="flex-1">
              <CurrentUserName />
            </div>
            <div className="flex-none">
              <SignOut />
            </div>
          </div>
          {children}
        </div>
        <div className="drawer-side">
          <label
            htmlFor="my-drawer-2"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <ul className="menu bg-base-200 text-base-content min-h-full w-fit p-4 space-y-2 text-base">
            <li className="ml-4 mt-1 font-semibold text-lg">Studio R.M.</li>
            <li>
              <Link href="/" className="hover:bg-base-300 rounded-md mt-8"><Home className="size-6" /> Home</Link>
            </li>
            <li>
              <Link href="/clienti" className="hover:bg-base-300 rounded-md"><Building2 className="size-6" /> Clienti</Link>
            </li>
            <li>
              <Link href="/mezzi" className="hover:bg-base-300 rounded-md"><FileText className="size-6" />Mezzi</Link>
            </li>
            <li>
              <Link href="/utenti" className="hover:bg-base-300 rounded-md"><Users className="size-6" /> Utenti</Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
