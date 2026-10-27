export function DeleteButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      aria-label={label}
      className="text-danger hover:bg-danger/10 inline-flex size-8 shrink-0 items-center justify-center rounded-full"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M9 9l6 6M15 9l-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
