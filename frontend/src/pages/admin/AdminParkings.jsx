import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  RiAddLine,
  RiCarLine,
  RiDeleteBin6Line,
  RiMapPin2Line,
  RiParkingBoxLine,
  RiRefreshLine,
} from "react-icons/ri";
import { FiEdit } from "react-icons/fi";
import { API_BASE_URL, APP_BASE_URL, bulkDeleteAdminResource, getStoredToken } from "../../api/client";
import AdminBulkActions from "./components/AdminBulkActions";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { confirmAdminAction, showAdminError, showAdminSuccess } from "./utils/adminAlerts";
import useBulkSelection from "./utils/useBulkSelection";
import "./css/ParkingAdmin.css";

const getImageUrl = (image) => {
  if (!image || image === "null" || image === "undefined") return "/images/default-parking.jpg";
  const imageValue = String(image).trim();
  if (/^https?:\/\//i.test(imageValue) || imageValue.startsWith("data:")) return imageValue;
  if (imageValue.startsWith("/images/")) return imageValue;
  if (imageValue.startsWith("/storage/")) return `${APP_BASE_URL}${imageValue}`;
  if (imageValue.startsWith("storage/")) return `${APP_BASE_URL}/${imageValue}`;
  const cleanPath = imageValue.replace(/^\/+/, "");
  return `${APP_BASE_URL}/storage/${cleanPath}`;
};

export default function AdminParkings() {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

  const fetchParkings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/parkings`, {
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
          Accept: "application/json",
        },
        params: {
          page,
          per_page: pagination.per_page,
          q: q || undefined,
          status: statusFilter || undefined,
          capacity: capacityFilter || undefined,
        },
      });
      const payload = res.data.success ? res.data.data : null;
      setParkings(payload?.data || []);
      setPagination({
        current_page: payload?.current_page || 1,
        last_page: payload?.last_page || 1,
        per_page: payload?.per_page || pagination.per_page,
        total: payload?.total || 0,
      });
    } catch (err) {
      console.error("Error fetching parkings:", err.response?.data || err.message);
      setParkings([]);
    } finally {
      setLoading(false);
    }
  }, [capacityFilter, page, pagination.per_page, q, statusFilter]);

  useEffect(() => {
    fetchParkings();
  }, [fetchParkings]);

  const totals = useMemo(() => {
    return parkings.reduce(
      (acc, parking) => {
        acc.slots += Number(parking.total_slots || 0);
        acc.available += Number(parking.available_slots || 0);
        return acc;
      },
      { lots: parkings.length, slots: 0, available: 0 }
    );
  }, [parkings]);
  const bulk = useBulkSelection(parkings);

  useEffect(() => {
    setPage(1);
  }, [capacityFilter, q, statusFilter]);

  const handleDeleteParking = async (parkingId, parkingName) => {
    const result = await confirmAdminAction({
      title: `Delete ${parkingName}?`,
      text: "Related slots will also be removed.",
      confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete(`${API_BASE_URL}/admin/parkings/${parkingId}`, {
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
          Accept: "application/json",
        },
      });

      if (res.data.success) {
        setParkings((items) => items.filter((item) => item.id !== parkingId));
        showAdminSuccess("Parking deleted");
      }
    } catch (err) {
      console.error("Error deleting parking:", err.response?.data || err.message);
      showAdminError("Failed to delete parking", err.response?.data?.message || "Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    const result = await confirmAdminAction({
      title: `Delete ${bulk.selectedCount} parking lots?`,
      text: "Related slots will also be removed.",
      confirmButtonText: "Yes, delete selected",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await bulkDeleteAdminResource("parkings", bulk.selectedNumericIds);
      bulk.clearSelection();
      showAdminSuccess("Bulk delete complete", response.message);
      fetchParkings();
    } catch (err) {
      showAdminError("Bulk delete failed", err.response?.data?.message || "Please try again.");
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  return (
    <section className="parking-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Parking Lots</h1>
        </div>
        <div className="parking-admin-actions">
          <button className="pa-btn pa-btn-ghost" type="button" onClick={fetchParkings}>
            <RiRefreshLine /> Refresh
          </button>
          <Link className="pa-btn pa-btn-primary" to="/admin/parkings/new">
            <RiAddLine /> Add Parking
          </Link>
        </div>
      </div>

      <div className="pa-stat-grid">
        <article className="pa-stat-card">
          <div>
            <span>Total Lots</span>
            <strong>{totals.lots}</strong>
          </div>
          <RiParkingBoxLine />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Total Slots</span>
            <strong>{totals.slots}</strong>
          </div>
          <RiCarLine />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Available Slots</span>
            <strong>{totals.available}</strong>
          </div>
          <RiRefreshLine />
        </article>
      </div>

      <AdminFilterBar
        searchValue={q}
        searchPlaceholder="Search by name, location, or description"
        onSearchChange={setQ}
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "", label: "All Status" },
              { value: "available", label: "Available" },
              { value: "full", label: "Full" },
            ],
          },
          {
            id: "capacity",
            label: "Capacity",
            value: capacityFilter,
            onChange: setCapacityFilter,
            options: [
              { value: "", label: "All Capacity" },
              { value: "has_slots", label: "Has Slots" },
              { value: "no_slots", label: "No Slots" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading parking lots...</div>
        ) : parkings.length === 0 ? (
          <div className="pa-empty-state">
            <RiParkingBoxLine />
            <h3>No parking lots found</h3>
            <p>Create a parking lot first, then connect slots with it.</p>
            <Link className="pa-btn pa-btn-primary" to="/admin/parkings/new">
              <RiAddLine /> Add First Parking
            </Link>
          </div>
        ) : (
          <>
            <AdminBulkActions
              selectedCount={bulk.selectedCount}
              totalCount={parkings.length}
              label="parking lots"
              onToggleAll={bulk.toggleAllVisible}
              onClear={bulk.clearSelection}
              onDelete={handleBulkDelete}
            />
            <div className="pa-table-wrap">
              <table className="pa-table">
                <thead>
                  <tr>
                    <th className="pa-select-col">Select</th>
                    <th>Parking</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parkings.map((parking) => {
                    const totalSlots = Number(parking.total_slots || 0);
                    const availableSlots = Number(parking.available_slots || 0);
                    const percentage = totalSlots ? (availableSlots / totalSlots) * 100 : 0;

                    return (
                      <tr key={parking.id}>
                        <td className="pa-select-col">
                          <label className="pa-row-check" title={`Select ${parking.name}`}>
                            <input type="checkbox" checked={bulk.isSelected(parking.id)} onChange={() => bulk.toggleSelection(parking.id)} />
                          </label>
                        </td>
                        <td>
                          <div className="pa-media-cell">
                            <img
                              src={getImageUrl(parking.image)}
                              alt={parking.name}
                              onError={(event) => {
                                event.currentTarget.src = "/images/default-parking.jpg";
                              }}
                            />
                            <div>
                              <strong>{parking.name}</strong>
                              <span>{parking.description || "No description added"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="pa-location-cell">
                            <span className="pa-icon-text">
                              <RiMapPin2Line /> {parking.address || "Address not set"}
                            </span>
                            <span className="pa-location-meta">
                              {parking.latitude && parking.longitude
                                ? `${Number(parking.latitude).toFixed(5)}, ${Number(parking.longitude).toFixed(5)}`
                                : "Coordinates not set"}
                            </span>
                            <span className="pa-location-fallback">
                              Fallback: {parking.distance || "Not set"}
                            </span>
                          </div>
                        </td>
                        <td className="parking-capacity-data">
                          <div className="pa-progress-copy">
                            <strong>{availableSlots}</strong>
                            <span>/ {totalSlots} free</span>
                          </div>
                          <div className="pa-progress">
                            <span style={{ width: `${Math.min(percentage, 100)}%` }} />
                          </div>
                        </td>
                        <td className="pa-price">
                          <span className="pa-price-value">{formatCurrency(parking.price_per_hour)}</span>
                        </td>
                        <td className="text-center">
                          <span className={`pa-status ${availableSlots > 0 ? "is-live" : "is-muted"}`}>
                            {availableSlots > 0 ? "Available" : "Full"}
                          </span>
                        </td>
                        <td>
                          <div className="pa-row-actions">
                            <Link className="pa-icon-btn" to={`/admin/parkings/${parking.id}/edit`} title="Edit">
                              <FiEdit />
                            </Link>
                            <button
                              className="pa-icon-btn is-danger"
                              type="button"
                              onClick={() => handleDeleteParking(parking.id, parking.name)}
                              title="Delete"
                            >
                              <RiDeleteBin6Line />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        showing={parkings.length}
        label="parking lots"
        onPageChange={setPage}
      />
    </section>
  );
}
