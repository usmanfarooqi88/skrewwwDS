"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-8 py-24">
      <p className="font-mono text-xs uppercase tracking-wide text-brand-500">Error</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-600">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-md border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50"
      >
        Try again
      </button>
    </div>
  );
}
