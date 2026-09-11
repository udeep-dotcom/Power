import { createTransactionAction } from "@/app/actions/transactions";

export default function NewTransactionPage() {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold text-slate-900">Create Filled Form</h1>
      <p className="mt-2 text-sm text-slate-500">
        Start a new transaction, then upload the blank form and its supporting documents.
      </p>
      <form action={createTransactionAction} className="mt-6">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Start
        </button>
      </form>
    </div>
  );
}
