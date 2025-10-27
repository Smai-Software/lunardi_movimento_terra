import { Menu } from "lucide-react";
import CurrentUserName from "@/components/current-username";
import SignOut from "@/components/logout-form";
import NavigationItem from "@/components/navigation-item";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
          <li className="ml-4 mt-1 font-semibold text-lg">L.M.T</li>
          <NavigationItem href="/" iconName="home" className="mt-8">
            Dashboard
          </NavigationItem>
          <NavigationItem href="/attivita" iconName="building2">
            Attività
          </NavigationItem>
          <NavigationItem href="/cantieri" iconName="hardhat">
            Cantieri
          </NavigationItem>
          <NavigationItem href="/mezzi" iconName="forklift">
            Mezzi
          </NavigationItem>
          <NavigationItem href="/utenti" iconName="users">
            Utenti
          </NavigationItem>
        </ul>
      </div>
    </div>
  );
}
