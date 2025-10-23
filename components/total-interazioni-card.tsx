import { getTotalInterazioniByCantiereId } from "./cantiere-stats";

export default async function TotalInterazioniCard({
  cantieriId,
}: {
  cantieriId: number;
}) {
  const totalInterazioni = await getTotalInterazioniByCantiereId(cantieriId);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-center">
        <h3 className="card-title text-lg justify-center">
          Totale Interazioni
        </h3>
        <p className="text-3xl font-bold text-primary">{totalInterazioni}</p>
      </div>
    </div>
  );
}
