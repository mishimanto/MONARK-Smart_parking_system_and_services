import { useCallback, useEffect, useMemo, useState } from "react";

export default function useBulkSelection(items) {
  const visibleIds = useMemo(() => items.map((item) => String(item.id)), [items]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => visibleIds.includes(id)));
  }, [visibleIds]);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const isSelected = useCallback(
    (id) => selectedIds.includes(String(id)),
    [selectedIds]
  );

  const toggleSelection = useCallback((id) => {
    const itemId = String(id);
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((selectedId) => selectedId !== itemId) : [...current, itemId]
    );
  }, []);

  const toggleAllVisible = useCallback(() => {
    setSelectedIds((current) => {
      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => current.includes(id));

      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  }, [visibleIds]);

  return {
    selectedIds,
    selectedNumericIds: selectedIds.map(Number),
    selectedCount: selectedIds.length,
    isSelected,
    toggleSelection,
    toggleAllVisible,
    clearSelection,
  };
}
