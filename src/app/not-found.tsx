import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-800">
        We couldn&apos;t find that record
      </h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        The tank, site, or inspection you&apos;re looking for doesn&apos;t exist
        or isn&apos;t available for your account.
      </p>
      <Link
        href="/login"
        className="mt-6 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
      >
        Back to sign in
      </Link>
    </div>
  );
}
