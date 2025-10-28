import CurrentUserName from "@/components/current-username";
import SignOut from "@/components/logout-form";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <CurrentUserName />
        </div>
        <div className="flex-none">
          <SignOut />
        </div>
      </div>
      {children}
    </div>
  );
}
