import { getUniqueMezziByCantiereId } from "./cantiere-stats";

export default async function UniqueMezziCard({
  cantieriId,
}: {
  cantieriId: number;
}) {
  const uniqueMezzi = await getUniqueMezziByCantiereId(cantieriId);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-center">
        <h3 className="card-title text-lg justify-center">Mezzi Unici</h3>
        <p className="text-3xl font-bold text-accent">{uniqueMezzi}</p>
      </div>
    </div>
  );
}
