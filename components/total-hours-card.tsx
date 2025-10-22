import { getTotalHoursByCantiereId } from "./cantiere-stats";

export default async function TotalHoursCard({
  cantieriId,
}: {
  cantieriId: number;
}) {
  const totalMilliseconds = await getTotalHoursByCantiereId(cantieriId);
  const totalMinutes = Math.floor(Number(totalMilliseconds) / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalTime = `${hours}:${minutes.toString().padStart(2, "0")}`;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-center">
        <h3 className="card-title text-lg justify-center">Ore Totali</h3>
        <p className="text-3xl font-bold text-primary">{totalTime}</p>
      </div>
    </div>
  );
}
