import React from "react";

const getPageItems = (currentPage, lastPage) => {
  const totalPages = Number(lastPage) || 1;
  const activePage = Number(currentPage) || 1;

  if (totalPages <= 8) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (activePage <= 5) {
    return [1, 2, 3, 4, 5, 6, 7, "end-ellipsis", totalPages];
  }

  if (activePage >= totalPages - 4) {
    return [
      1,
      "start-ellipsis",
      ...Array.from({ length: 7 }, (_, index) => totalPages - 6 + index),
    ];
  }

  return [
    1,
    "start-ellipsis",
    activePage - 2,
    activePage - 1,
    activePage,
    activePage + 1,
    activePage + 2,
    "end-ellipsis",
    totalPages,
  ];
};

export default function ServicePagination({ pagination, loading, onPageChange }) {
  const currentPage = Number(pagination.current_page) || 1;
  const lastPage = Number(pagination.last_page) || 1;

  if (lastPage <= 1) {
    return null;
  }

  const pageItems = getPageItems(currentPage, lastPage);

  return (
    <div className="services-pagination" aria-label="Pagination">
      <button
        className="services-page-btn services-page-nav"
        disabled={currentPage <= 1 || loading}
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
      >
        Previous
      </button>

      <div className="services-page-numbers">
        {pageItems.map((item) => {
          if (typeof item === "string") {
            return (
              <span key={item} className="services-page-ellipsis">
                ...
              </span>
            );
          }

          return (
            <button
              key={item}
              className={`services-page-btn services-page-number${item === currentPage ? " is-active" : ""}`}
              disabled={loading || item === currentPage}
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? "page" : undefined}
            >
              {item}
            </button>
          );
        })}
      </div>

      <button
        className="services-page-btn services-page-nav"
        disabled={currentPage >= lastPage || loading}
        onClick={() => onPageChange(Math.min(currentPage + 1, lastPage))}
      >
        Next
      </button>
    </div>
  );
}
