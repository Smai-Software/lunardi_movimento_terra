import AttivitaForm from "@/components/attivita-form";
import { getUsersNotBanned } from "@/lib/data/users.data";

export default async function NewAttivitaPage() {
  const users = await getUsersNotBanned();

  return (
    <div className="container mx-auto p-6">
      <AttivitaForm users={users} />
    </div>
  );
}
