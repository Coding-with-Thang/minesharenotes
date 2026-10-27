"use client";

export default function WorkspaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="border-line bg-card grid max-w-lg gap-3 rounded-2xl border p-6">
      <h1 className="text-xl font-semibold">Could not load this page</h1>
      <p className="text-muted text-sm">
        The database may be waking up. Wait a moment and try again.
      </p>
      <button type="button" className="btn-primary w-fit" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
