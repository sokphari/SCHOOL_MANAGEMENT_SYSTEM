export default function AppPagination({
  currentPage,
  lastPage,
  onPageChange,
}) {
  if (!lastPage || lastPage <= 1) return null;

  const pages = [];

  for (let i = 1; i <= lastPage; i++) {
    pages.push(i);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        marginTop: "20px",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: "8px 12px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          background: "#fff",
        }}
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
            background: currentPage === page ? "#111827" : "#fff",
            color: currentPage === page ? "#fff" : "#000",
          }}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        style={{
          padding: "8px 12px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          cursor: currentPage === lastPage ? "not-allowed" : "pointer",
          background: "#fff",
        }}
      >
        Next
      </button>
    </div>
  );
}