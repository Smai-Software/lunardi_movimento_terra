import { getUniqueUsersByCantiereId } from "./cantiere-stats";

export default async function UniqueUsersCard({
  cantieriId,
}: {
  cantieriId: number;
}) {
  const uniqueUsers = await getUniqueUsersByCantiereId(cantieriId);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-center">
        <h3 className="card-title text-lg justify-center">Utenti Unici</h3>
        <p className="text-3xl font-bold text-secondary">{uniqueUsers}</p>
      </div>
    </div>
  );
}
