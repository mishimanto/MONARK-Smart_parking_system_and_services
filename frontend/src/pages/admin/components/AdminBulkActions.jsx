import { RiCheckboxCircleLine, RiCloseLine, RiDeleteBin6Line } from "react-icons/ri";

export default function AdminBulkActions({
  selectedCount,
  totalCount,
  label = "items",
  disabled = false,
  onToggleAll,
  onClear,
  onDelete,
}) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className={`pa-bulk-toolbar ${selectedCount > 0 ? "is-active" : ""}`}>
      <label className="pa-check-control">
        <input type="checkbox" checked={allSelected} onChange={onToggleAll} disabled={disabled || totalCount === 0} />
        <span>{allSelected ? "Deselect all" : "Select all"}</span>
      </label>
      <div className="pa-bulk-copy">
        <RiCheckboxCircleLine />
        <strong>{selectedCount > 0 ? `${selectedCount} selected` : `Bulk actions for ${label}`}</strong>
      </div>
      <div className="pa-bulk-actions">
        {selectedCount > 0 && (
          <button className="pa-icon-btn" type="button" onClick={onClear} disabled={disabled} title="Clear selection">
            <RiCloseLine />
          </button>
        )}
        <button className="pa-btn pa-btn-danger" type="button" onClick={onDelete} disabled={disabled || selectedCount === 0}>
          <RiDeleteBin6Line /> Delete Selected
        </button>
      </div>
    </div>
  );
}
