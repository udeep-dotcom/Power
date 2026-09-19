import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
      <h1 className="text-sm font-semibold text-slate-900">Not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        This transaction doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
