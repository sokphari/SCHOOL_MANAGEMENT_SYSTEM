interface AppPaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  showSinglePage?: boolean;
}

export default function AppPagination({ currentPage, lastPage, onPageChange, showSinglePage = false }: AppPaginationProps) {
  if (!lastPage || (lastPage <= 1 && !showSinglePage)) return null;

  const start = Math.max(1, Math.min(currentPage - 1, lastPage - 2));
  const end = Math.min(lastPage, start + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const buttonClass = "grid size-9 place-items-center rounded-lg border border-border text-xs font-medium text-secondary transition hover:bg-brand-soft hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav className="flex flex-wrap items-center gap-1.5" aria-label="Pagination">
      <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`${buttonClass} w-auto px-3`}>
        <span className="sm:hidden">‹</span><span className="hidden sm:inline">Previous</span>
      </button>
      {start > 1 && <><PageButton page={1} currentPage={currentPage} onPageChange={onPageChange} /><span className="px-1 text-xs text-muted">…</span></>}
      {pages.map((page) => <PageButton key={page} page={page} currentPage={currentPage} onPageChange={onPageChange} />)}
      {end < lastPage && <><span className="px-1 text-xs text-muted">…</span><PageButton page={lastPage} currentPage={currentPage} onPageChange={onPageChange} /></>}
      <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === lastPage} className={`${buttonClass} w-auto px-3`}>
        <span className="sm:hidden">›</span><span className="hidden sm:inline">Next</span>
      </button>
    </nav>
  );
}

function PageButton({ page, currentPage, onPageChange }: { page: number; currentPage: number; onPageChange: (page: number) => void }) {
  const isCurrent = page === currentPage;
  return <button type="button" onClick={() => onPageChange(page)} aria-current={isCurrent ? "page" : undefined} aria-label={`Go to page ${page}`} className={`grid size-9 place-items-center rounded-lg border text-xs font-semibold transition ${isCurrent ? "border-brand bg-brand text-white" : "border-border text-secondary hover:bg-brand-soft hover:text-brand-strong"}`}>{page}</button>;
}
