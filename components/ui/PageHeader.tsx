import Link from "next/link";

export function PageHeader({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 border-b border-primary/20 bg-primary/95 px-4 py-3 backdrop-blur">
      {backHref && (
        <Link href={backHref} aria-label="Back" className="text-gold">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}
      <h1 className="flex-1 truncate text-lg font-bold text-white">{title}</h1>
      {action}
    </header>
  );
}
