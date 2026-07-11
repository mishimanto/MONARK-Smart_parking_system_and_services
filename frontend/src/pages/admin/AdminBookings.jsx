import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  RiCalendarCheckLine,
  RiParkingBoxLine,
  RiRefreshLine,
  RiTimeLine,
} from "react-icons/ri";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { API_BASE_URL, getStoredToken } from "../../api/client";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import "./css/ParkingAdmin.css";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  const fetchBookings = useCallback(
    async (
      targetPage = 1,
      query = q,
      status = statusFilter,
      dates = dateRange
    ) => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/bookings`, {
          params: {
            page: targetPage,
            per_page: perPage,
            q: query || undefined,
            status: status || undefined,
            date_from: dates.start || undefined,
            date_to: dates.end || undefined,
          },
          headers: {
            Authorization: `Bearer ${getStoredToken()}`,
            Accept: "application/json",
          },
        });

        if (res.data.success) {
          setBookings(res.data.data.data);
          setMeta({
            current_page: res.data.data.current_page,
            last_page: res.data.data.last_page,
            per_page: res.data.data.per_page,
            total: res.data.data.total,
          });
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err.response?.data || err.message);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    },
    [dateRange, perPage, q, statusFilter]
  );

  useEffect(() => {
    fetchBookings(page);
  }, [fetchBookings, page]);

  const bookingStats = useMemo(() => {
    const revenue = bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    const active = bookings.filter((booking) => ["active", "confirmed"].includes(booking.status)).length;
    return { visible: bookings.length, active, revenue };
  }, [bookings]);

  const handleSearchChange = (value) => {
    setQ(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDateChange = (field, value) => {
    setDateRange((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  const handleRefresh = () => {
    setQ("");
    setStatusFilter("");
    setDateRange({ start: "", end: "" });
    setPage(1);
    fetchBookings(1, "", "", { start: "", end: "" });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="parking-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Bookings</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={handleRefresh}>
          <RiRefreshLine /> Refresh
        </button>
      </div>

      <div className="pa-stat-grid">
        <article className="pa-stat-card">
          <div>
            <span>Total Records</span>
            <strong>{meta.total}</strong>
          </div>
          <RiCalendarCheckLine />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Visible Active</span>
            <strong>{bookingStats.active}</strong>
          </div>
          <RiParkingBoxLine />
        </article>
        <article className="pa-stat-card">
          <div>
            <span>Visible Revenue</span>
            <strong>{formatCurrency(bookingStats.revenue)}</strong>
          </div>
          <FaBangladeshiTakaSign />
        </article>
      </div>

      <AdminFilterBar
        searchValue={q}
        searchPlaceholder="Search booking id, user, parking, or slot"
        onSearchChange={handleSearchChange}
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: handleStatusChange,
            options: [
              { value: "", label: "All Status" },
              { value: "confirmed", label: "Confirmed" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
              { value: "pending", label: "Pending" },
            ],
          },
          {
            id: "date_from",
            label: "Start Date",
            type: "date",
            value: dateRange.start,
            onChange: (value) => handleDateChange("start", value),
          },
          {
            id: "date_to",
            label: "End Date",
            type: "date",
            value: dateRange.end,
            onChange: (value) => handleDateChange("end", value),
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading booking records...</div>
        ) : bookings.length === 0 ? (
          <div className="pa-empty-state">
            <RiCalendarCheckLine />
            <h3>No bookings found</h3>
            <p>{q || statusFilter || dateRange.start || dateRange.end ? "Try another search or filter." : "No parking booking has been created yet."}</p>
          </div>
        ) : (
          <div className="pa-table-wrap">
            <table className="pa-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Parking</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="text-center">
                      <strong>#{booking.id}</strong>
                      <span className="pa-cell-note">
                        <RiParkingBoxLine /> {booking.slot?.slot_code || "N/A"}
                      </span>
                    </td>
                    <td>
                      <strong>{booking.user?.name || "N/A"}</strong>
                      <span className="pa-cell-note">{booking.user?.email || "No email"}</span>
                    </td>
                    <td className="text-center">
                      {booking.parking?.name || "N/A"}
                    </td>
                    <td className="text-center">
                      <span className="pa-icon-text">
                        <RiTimeLine /> {booking.hours || 0} hr
                      </span>
                    </td>
                    <td className="pa-price">
                      <span className="pa-price-value">
                        {formatCurrency(booking.total_price)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`pa-status is-${booking.status || "muted"}`}>
                        {booking.status || "unknown"}
                      </span>
                    </td>
                    <td className="text-center">{formatDate(booking.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <AdminPagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            perPage={meta.per_page}
            total={meta.total}
            label="bookings"
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
}
