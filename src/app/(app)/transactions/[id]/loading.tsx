export default function TransactionLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-slate-100" />
      <div className="space-y-2">
        <div className="h-6 w-56 rounded bg-slate-100" />
        <div className="h-5 w-24 rounded-full bg-slate-100" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="h-48 rounded-lg border border-slate-200 bg-slate-100" />
        <div className="h-48 rounded-lg border border-slate-200 bg-slate-100" />
      </div>
    </div>
  );
}
