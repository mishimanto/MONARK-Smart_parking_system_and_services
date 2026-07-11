import React, { useEffect, useRef, useState } from "react";
import { RiCloseLine, RiSearchLine } from "react-icons/ri";
import "../css/AdminFilterBar.css";

export default function AdminFilterBar({
  searchValue = "",
  searchPlaceholder = "Search...",
  onSearchChange,
  filters = [],
  actions,
  debounceMs = 2000,
}) {
  const [draftSearch, setDraftSearch] = useState(searchValue);
  const onSearchChangeRef = useRef(onSearchChange);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    setDraftSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draftSearch !== searchValue) {
        onSearchChangeRef.current?.(draftSearch);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, draftSearch, searchValue]);

  const hasActiveFilter = filters.some((filter) =>
    filter.isActive ? filter.isActive(filter.value) : Boolean(filter.value)
  ) || Boolean(draftSearch);
  const hasClearableControls = Boolean(onSearchChange) || filters.length > 0;

  const clearAll = () => {
    if (!hasActiveFilter) return;
    setDraftSearch("");
    onSearchChangeRef.current?.("");
    filters.forEach((filter) => filter.onChange?.(filter.clearValue ?? ""));
  };

  return (
    <section className="admin-filter-bar">
      {onSearchChange && (
        <div className="admin-filter-search">
          <RiSearchLine />
          <input
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      {filters.map((filter) => {
        if (filter.type === "date") {
          return (
            <input
              key={filter.id || filter.label}
              className="admin-filter-field"
              type="date"
              value={filter.value}
              onChange={(event) => filter.onChange?.(event.target.value)}
              aria-label={filter.label}
            />
          );
        }

        return (
          <select
            key={filter.id || filter.label}
            value={filter.value}
            onChange={(event) => filter.onChange?.(event.target.value)}
            aria-label={filter.label}
          >
            {(filter.options || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      })}

      {hasClearableControls && (
        <button
          className="admin-filter-clear"
          type="button"
          onClick={clearAll}
          disabled={!hasActiveFilter}
        >
          <RiCloseLine /> Clear
        </button>
      )}

      {actions && <div className="admin-filter-actions">{actions}</div>}
    </section>
  );
}
