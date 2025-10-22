export default function StatsCardSkeleton() {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-center">
        <div className="skeleton h-6 w-24 mx-auto mb-2"></div>
        <div className="skeleton h-8 w-16 mx-auto"></div>
      </div>
    </div>
  );
}
