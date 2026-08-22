import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="text-6xl font-black text-indigo-200">404</div>
      <h1 className="mt-2 text-xl font-bold text-slate-900">Page not found</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        The page you are looking for does not exist or was moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
