"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h1 className="text-sm font-semibold text-red-800">Something went wrong</h1>
      <p className="mt-2 text-sm text-red-700">
        {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred."} Try again, or
        contact an admin if this keeps happening.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
      >
        Try again
      </button>
    </div>
  );
}
