import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBin6Line,
  RiParkingBoxLine,
  RiRefreshLine,
} from "react-icons/ri";
import { FiEdit } from "react-icons/fi";
import { API_BASE_URL, bulkDeleteAdminResource, getStoredToken } from "../../api/client";
import AdminBulkActions from "./components/AdminBulkActions";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { confirmAdminAction, showAdminError, showAdminSuccess } from "./utils/adminAlerts";
import useBulkSelection from "./utils/useBulkSelection";
import "./css/ParkingAdmin.css";

export default function AdminSlots() {
  const [slots, setSlots] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterParking, setFilterParking] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getStoredToken()}`,
      Accept: "application/json",
    }),
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, parkingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/slots`, {
          headers: authHeaders,
          params: {
            page,
            per_page: pagination.per_page,
            q: q || undefined,
            parking_id: filterParking || undefined,
            status: filterStatus || undefined,
          },
        }),
        axios.get(`${API_BASE_URL}/admin/parkings`, { headers: authHeaders, params: { per_page: 1000 } }),
      ]);
      const slotsPayload = slotsRes.data.success ? slotsRes.data.data : null;
      const parkingsPayload = parkingsRes.data.success ? parkingsRes.data.data : null;

      setSlots(slotsPayload?.data || []);
      setPagination({
        current_page: slotsPayload?.current_page || 1,
        last_page: slotsPayload?.last_page || 1,
        per_page: slotsPayload?.per_page || pagination.per_page,
        total: slotsPayload?.total || 0,
      });
      setParkings(parkingsPayload?.data || []);
    } catch (err) {
      console.error("Error fetching slot data:", err.response?.data || err.message);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, filterParking, filterStatus, page, pagination.per_page, q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getParkingName = useCallback(
    (parkingId) =>
      parkings.find((parking) => String(parking.id) === String(parkingId))?.name || "Unknown Parking",
    [parkings]
  );

  const slotStats = useMemo(() => {
    const available = slots.filter((slot) => slot.available).length;
    return {
      total: slots.length,
      available,
      occupied: slots.length - available,
    };
  }, [slots]);
  const bulk = useBulkSelection(slots);

  useEffect(() => {
    setPage(1);
  }, [filterParking, filterStatus, q]);

  const handleDeleteSlot = async (slotId, slotCode) => {
    const result = await confirmAdminAction({
      title: `Delete slot ${slotCode}?`,
      text: "This action cannot be undone.",
      confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`${API_BASE_URL}/admin/slots/${slotId}`, { headers: authHeaders });
      if (res.data.success) {
        setSlots((items) => items.filter((item) => item.id !== slotId));
        showAdminSuccess("Slot deleted");
      }
    } catch (err) {
      console.error("Error deleting slot:", err.response?.data || err.message);
      showAdminError("Failed to delete slot", err.response?.data?.message || "Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    const result = await confirmAdminAction({
      title: `Delete ${bulk.selectedCount} slots?`,
      text: "Slots with active bookings will be skipped.",
      confirmButtonText: "Yes, delete selected",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await bulkDeleteAdminResource("slots", bulk.selectedNumericIds);
      bulk.clearSelection();
      showAdminSuccess("Bulk delete complete", response.message);
      fetchData();
    } catch (err) {
      showAdminError("Bulk delete failed", err.response?.data?.message || "Please try again.");
    }
  };

  const toggleSlotAvailability = async (slot) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/admin/slots/${slot.id}/toggle-availability`,
        { available: !slot.available },
        {
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        setSlots((items) =>
          items.map((item) =>
            item.id === slot.id ? { ...item, available: !item.available } : item
          )
        );
        showAdminSuccess(
          "Slot availability updated",
          `${slot.slot_code} is now ${slot.available ? "occupied" : "available"}.`
        );
      }
    } catch (err) {
      console.error("Error toggling slot:", err.response?.data || err.message);
      showAdminError("Failed to update slot availability", err.response?.data?.message || "Please try again.");
    }
  };

  return (
    <section className="parking-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Parking Slots</h1>
        </div>
        <div className="parking-admin-actions">
          <button className="pa-btn pa-btn-ghost" type="button" onClick={fetchData}>
            <RiRefreshLine /> Refresh
          </button>
          <Link className="pa-btn pa-btn-primary" to="/admin/slots/new">
            <RiAddLine /> Add Slot
          </Link>
        </div>
      </div>

      <div className="pa-stat-grid">
        <article className="pa-stat-card">
          <div>
            <span>Total Slots</span>
            <strong>{slotStats.total}</strong>
          </div>
          <RiParkingBoxLine />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Available</span>
            <strong>{slotStats.available}</strong>
          </div>
          <RiCheckboxCircleLine />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Occupied</span>
            <strong>{slotStats.occupied}</strong>
          </div>
          <RiCloseCircleLine />
        </article>
      </div>

      <AdminFilterBar
        searchValue={q}
        searchPlaceholder="Search by slot code, type, or parking"
        onSearchChange={setQ}
        filters={[
          {
            id: "parking",
            label: "Parking",
            value: filterParking,
            onChange: setFilterParking,
            options: [
              { value: "", label: "All Parkings" },
              ...parkings.map((parking) => ({ value: String(parking.id), label: parking.name })),
            ],
          },
          {
            id: "status",
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { value: "", label: "All Status" },
              { value: "available", label: "Available" },
              { value: "occupied", label: "Occupied" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading parking slots...</div>
        ) : slots.length === 0 ? (
          <div className="pa-empty-state">
            <RiParkingBoxLine />
            <h3>No slots found</h3>
            <p>Create slots for each parking lot so users can book accurately.</p>
            <Link className="pa-btn pa-btn-primary" to="/admin/slots/new">
              <RiAddLine /> Add First Slot
            </Link>
          </div>
        ) : (
          <>
          <AdminBulkActions
            selectedCount={bulk.selectedCount}
            totalCount={slots.length}
            label="parking slots"
            onToggleAll={bulk.toggleAllVisible}
            onClear={bulk.clearSelection}
            onDelete={handleBulkDelete}
          />
          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead>
                <tr>
                  <th className="pa-select-col">Select</th>
                  <th>Slot</th>
                  <th>Parking Lot</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="pa-select-col">
                      <label className="pa-row-check" title={`Select ${slot.slot_code}`}>
                        <input type="checkbox" checked={bulk.isSelected(slot.id)} onChange={() => bulk.toggleSelection(slot.id)} />
                      </label>
                    </td>
                    <td className="text-center">
                      <span className="pa-slot-code">
                        <RiParkingBoxLine /> {slot.slot_code}
                      </span>
                    </td>
                    <td className="text-center">
                      <strong>{getParkingName(slot.parking_id)}</strong>
                    </td>
                    <td className="text-center">
                      <span className="pa-status is-soft">{slot.type || "Standard"}</span>
                    </td>
                    <td className="text-center">
                      <span className={`pa-status ${slot.available ? "is-live" : "is-danger"}`}>
                        {slot.available ? <RiCheckboxCircleLine /> : <RiCloseCircleLine />}
                        {slot.available ? "Available" : "Occupied"}
                      </span>
                    </td>
                    <td className="text-center">
                      {slot.created_at ? new Date(slot.created_at).toLocaleDateString("en-BD") : "N/A"}
                    </td>
                    <td className="d-flex justify-center">
                      <div className="pa-row-actions">
                        <button
                          className="pa-icon-btn"
                          type="button"
                          onClick={() => toggleSlotAvailability(slot)}
                          title={slot.available ? "Mark occupied" : "Mark available"}
                        >
                          {slot.available ? <RiCloseCircleLine /> : <RiCheckboxCircleLine />}
                        </button>
                        <Link className="pa-icon-btn" to={`/admin/slots/${slot.id}/edit`} title="Edit">
                          <FiEdit />
                        </Link>
                        <button
                          className="pa-icon-btn is-danger"
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id, slot.slot_code)}
                          disabled={!slot.available}
                          title={!slot.available ? "Occupied slots cannot be deleted" : "Delete"}
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
      <AdminPagination
        currentPage={pagination.current_page}
        lastPage={pagination.last_page}
        perPage={pagination.per_page}
        total={pagination.total}
        showing={slots.length}
        label="parking slots"
        onPageChange={setPage}
      />
    </section>
  );
}
