import React from "react";
import "../css/AdminPagination.css";

const getPageItems = (currentPage, lastPage) => {
  const totalPages = Number(lastPage) || 1;
  const activePage = Number(currentPage) || 1;

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (activePage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (activePage >= totalPages - 3) {
    return [1, "start-ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "start-ellipsis", activePage - 1, activePage, activePage + 1, "end-ellipsis", totalPages];
};

export default function AdminPagination({
  currentPage = 1,
  lastPage = 1,
  perPage,
  total = 0,
  showing,
  label = "records",
  onPageChange,
}) {
  if (!lastPage || lastPage <= 1) return null;

  const start = total && perPage ? (currentPage - 1) * perPage + 1 : null;
  const end = total && perPage ? Math.min(currentPage * perPage, total) : null;
  const pageItems = getPageItems(currentPage, lastPage);

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">
        {start && end
          ? `Showing ${start} to ${end} of ${total} ${label}`
          : `Showing ${showing || 0} of ${total} ${label}`}
      </span>
      <div className="admin-pagination-actions">
        <button
          type="button"
          className="admin-page-btn admin-page-nav"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
        >
          Previous
        </button>

        <div className="admin-page-numbers">
          {pageItems.map((item) => {
            if (typeof item === "string") {
              return (
                <span key={item} className="admin-page-ellipsis">
                  ...
                </span>
              );
            }

            return (
              <button
                key={item}
                type="button"
                className={`admin-page-btn admin-page-number${item === currentPage ? " is-active" : ""}`}
                disabled={item === currentPage}
                onClick={() => onPageChange?.(item)}
                aria-current={item === currentPage ? "page" : undefined}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="admin-page-btn admin-page-nav"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange?.(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
