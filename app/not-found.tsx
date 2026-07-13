import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-8 py-24">
      <p className="font-mono text-xs uppercase tracking-wide text-brand-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-600">
        The page you requested does not exist in this documentation site.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-md border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50"
      >
        Back to home
      </Link>
    </div>
  );
}
