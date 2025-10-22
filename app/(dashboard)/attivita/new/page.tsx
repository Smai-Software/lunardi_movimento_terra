import AttivitaForm from "@/components/attivita-form";
import { getUsersNotBanned } from "@/lib/data/users.data";

export default async function NewAttivitaPage() {
  const users = await getUsersNotBanned();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuova Attività</h1>
        <p className="text-gray-600 mt-2">
          Crea una nuova attività con interazioni per cantieri e mezzi
        </p>
      </div>

      <AttivitaForm users={users} />
    </div>
  );
}
