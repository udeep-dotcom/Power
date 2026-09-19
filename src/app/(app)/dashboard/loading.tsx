export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-slate-200 bg-slate-100" />
        ))}
      </div>
      <div className="h-6 w-40 rounded bg-slate-100" />
      <div className="h-64 rounded-lg border border-slate-200 bg-slate-100" />
    </div>
  );
}
