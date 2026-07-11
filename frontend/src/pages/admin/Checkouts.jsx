import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  RiCalendarCheckLine,
  RiCheckDoubleLine,
  RiCloseCircleLine,
  RiCoinsLine,
  RiFileList3Line,
  RiInboxLine,
  RiMapPinLine,
  RiMoneyDollarCircleLine,
  RiParkingBoxLine,
  RiRefreshLine,
  RiTimeLine,
  RiUser3Line,
  RiWallet3Line,
} from "react-icons/ri";
import { adminAPI } from "../../api/client";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/CheckoutAdmin.css";

export default function AdminCheckouts() {
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [stats, setStats] = useState({
    pending_requests: 0,
    awaiting_payment: 0,
    ready_for_approval: 0,
    total_revenue: 0,
  });
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminAPI.getCheckoutStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchPendingCheckouts = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingCheckouts({
        q: searchTerm,
        status: statusFilter || undefined,
        page: p,
        per_page: perPage,
      });

      if (response.data.success) {
        const payload = response.data.data;
        const rows = payload.data || payload;
        setCheckouts(rows);
        setMeta({
          current_page: payload.current_page || 1,
          last_page: payload.last_page || 1,
          per_page: payload.per_page || perPage,
          total: payload.total || rows.length,
        });
        await fetchStats();
      }
    } catch (error) {
      console.error("Failed to fetch checkouts:", error);
      showErrorToast("Failed to load pending checkouts");
    } finally {
      setLoading(false);
    }
  }, [fetchStats, perPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchPendingCheckouts(page);
  }, [fetchPendingCheckouts, page]);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handleRefresh = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPage(1);
  };

  const handleApproveCheckout = async (checkoutId) => {
    try {
      setActionLoading(checkoutId);

      const result = await Swal.fire({
        title: "Approve checkout?",
        text: "This will generate a ticket and release the parking slot.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, approve",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#00b8c4",
        cancelButtonColor: "#64748b",
      });

      if (!result.isConfirmed) {
        setActionLoading(null);
        return;
      }

      const response = await adminAPI.approveCheckout(checkoutId);

      if (response.data.success) {
        showSuccessToast("Approved", `Ticket #${response.data.data.ticket_number} generated successfully.`);
        fetchPendingCheckouts(page);
      }
    } catch (error) {
      console.error("Approve failed:", error);
      showErrorToast("Failed to approve checkout");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCheckout = async (checkoutId) => {
    try {
      setActionLoading(checkoutId);

      const result = await Swal.fire({
        title: "Reject checkout?",
        text: "Are you sure you want to reject this checkout request?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, reject",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
      });

      if (!result.isConfirmed) {
        setActionLoading(null);
        return;
      }

      const response = await adminAPI.rejectCheckout(checkoutId);

      if (response.data.success) {
        showSuccessToast("Rejected", "Checkout request rejected successfully.");
        fetchPendingCheckouts(page);
      }
    } catch (error) {
      console.error("Reject failed:", error);
      showErrorToast("Failed to reject checkout");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount) => `BDT ${Number(amount || 0).toFixed(2)}`;

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

  const calculateTimeDetails = (booking) => {
    const scheduledEnd = new Date(booking.end_time);
    const actualEnd = new Date(booking.actual_end_time);
    const extraMinutes = Math.max(0, Math.ceil((actualEnd - scheduledEnd) / (1000 * 60)));

    return {
      extraMinutes,
      roundedMinutes: Math.ceil(extraMinutes / 10) * 10,
      extraCharges: booking.extra_charges || 0,
    };
  };

  const statCards = [
    { label: "Pending Requests", value: stats.pending_requests, icon: <RiFileList3Line /> },
    { label: "Awaiting Payment", value: stats.awaiting_payment, icon: <RiWallet3Line /> },
    { label: "Ready Approval", value: stats.ready_for_approval, icon: <RiCheckDoubleLine /> },
    { label: "Total Revenue", value: formatCurrency(stats.total_revenue), icon: <RiCoinsLine /> },
  ];

  const getStatusMeta = (checkout) => {
    if (checkout.status === "checkout_requested" && Number(checkout.extra_charges || 0) > 0) {
      return { label: "Payment Required", className: "is-pending", icon: <RiMoneyDollarCircleLine /> };
    }
    if (checkout.status === "checkout_requested") {
      return { label: "Pending Review", className: "is-confirmed", icon: <RiTimeLine /> };
    }
    if (checkout.status === "checkout_paid") {
      return { label: "Ready to Approve", className: "is-live", icon: <RiCheckDoubleLine /> };
    }
    return { label: checkout.status, className: "is-soft", icon: <RiFileList3Line /> };
  };

  return (
    <section className="parking-admin-page service-admin-page checkout-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Parking Checkouts</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={handleRefresh}>
          <RiRefreshLine /> Refresh
        </button>
      </div>

      <div className="checkout-stat-grid">
        {statCards.map((card) => (
          <article className="pa-stat-card" key={card.label}>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
            {card.icon}
          </article>
        ))}
      </div>

      <AdminFilterBar
        searchValue={searchTerm}
        searchPlaceholder="Search checkout request, user, parking, or slot"
        onSearchChange={handleSearchChange}
        filters={[
          {
            id: "status",
            label: "Checkout Status",
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setPage(1);
            },
            options: [
              { value: "", label: "All Status" },
              { value: "pending_review", label: "Pending Review" },
              { value: "payment_required", label: "Payment Required" },
              { value: "ready_approval", label: "Ready Approval" },
            ],
          },
        ]}
      />

      

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading checkout requests...</div>
        ) : checkouts.length === 0 ? (
          <div className="pa-empty-state">
            <RiInboxLine />
            <h3>No pending checkouts</h3>
            <p>{searchTerm || statusFilter ? "No checkouts match your filters." : "All checkout requests have been processed."}</p>
            {(searchTerm || statusFilter) && (
              <button className="pa-btn pa-btn-primary" type="button" onClick={handleRefresh}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="pa-table-wrap">
            <table className="pa-table checkout-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>User</th>
                  <th>Parking & Slot</th>
                  <th>Duration</th>
                  <th>Charges</th>
                  <th>Status</th>
                  <th className="checkout-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {checkouts.map((checkout) => {
                  const timeDetails = calculateTimeDetails(checkout);
                  const status = getStatusMeta(checkout);
                  const totalPrice = Number(checkout.total_price || 0);
                  const extraCharges = Number(checkout.extra_charges || 0);

                  return (
                    <tr key={checkout.id}>
                      <td>
                        <strong>#{checkout.id}</strong>
                        <span className="pa-cell-note">
                          <RiCalendarCheckLine /> {formatDate(checkout.created_at)}
                        </span>
                      </td>
                      <td>
                        <span className="pa-icon-text"><RiUser3Line /> {checkout.user?.name || "N/A"}</span>
                        <span className="pa-cell-note">{checkout.user?.email || "N/A"}</span>
                      </td>
                      <td>
                        <span className="pa-icon-text"><RiParkingBoxLine /> {checkout.parking?.name || "N/A"}</span>
                        <span className="pa-slot-code">Slot: {checkout.slot?.slot_code || "N/A"}</span>
                        {checkout.parking?.distance && (
                          <span className="pa-cell-note"><RiMapPinLine /> {checkout.parking.distance}</span>
                        )}
                      </td>
                      <td>
                        <div className="checkout-time-stack">
                          <span><strong>Booked:</strong> {checkout.hours} hour(s)</span>
                          <span><strong>Ends:</strong> {formatDate(checkout.end_time)}</span>
                          <span><strong>Actual:</strong> {formatDate(checkout.actual_end_time)}</span>
                          {timeDetails.extraMinutes > 0 && (
                            <span className="checkout-extra-time">Extra: {timeDetails.extraMinutes} min</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="checkout-charge-stack">
                          <strong>{formatCurrency(totalPrice)}</strong>
                          {extraCharges > 0 && <span>+ {formatCurrency(extraCharges)}</span>}
                          <em>Total: {formatCurrency(totalPrice + extraCharges)}</em>
                        </div>
                      </td>
                      <td>
                        <span className={`pa-status ${status.className}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="pa-row-actions checkout-row-actions">
                          <button
                            className="pa-mini-btn is-confirm"
                            type="button"
                            onClick={() => handleApproveCheckout(checkout.id)}
                            disabled={actionLoading === checkout.id}
                            title="Approve checkout and generate ticket"
                          >
                            <RiCheckDoubleLine /> Approve
                          </button>

                          {(checkout.status === "checkout_requested" || checkout.status === "checkout_paid") && (
                            <button
                              className="pa-mini-btn is-cancelled"
                              type="button"
                              onClick={() => handleRejectCheckout(checkout.id)}
                              disabled={actionLoading === checkout.id}
                              title="Reject checkout request"
                            >
                              <RiCloseCircleLine /> Reject
                            </button>
                          )}
                        </div>

                        {checkout.status === "checkout_requested" && extraCharges > 0 && (
                          <span className="checkout-action-note is-warning">User needs to pay extra charges first</span>
                        )}
                        {checkout.status === "checkout_paid" && (
                          <span className="checkout-action-note is-success">All payments completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
            label="checkout requests"
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
}
