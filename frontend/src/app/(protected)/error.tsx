"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="mt-3 text-xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mb-6 mt-1 max-w-md text-sm text-slate-500">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Try again
      </button>
    </div>
  );
}
