import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiDownload2Line,
  RiFileList3Line,
  RiTicket2Line,
} from "react-icons/ri";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { AuthContext } from "../contexts/AuthContext";
import { bookingAPI, serviceOrdersAPI } from "../api/client";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import "./css/Dashboard.css";

const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatMoney = (amount) => `BDT ${Number.parseFloat(amount || 0).toFixed(2)}`;
const normalizeStatus = (status = "") => status.replaceAll("_", " ");
const emptyPagination = { current_page: 1, last_page: 1, total: 0, from: null, to: null };

function DashboardPagination({ pagination, onPageChange }) {
  if (!pagination || pagination.last_page <= 1) return null;

  return (
    <div className="dashboard-pagination">
      <button type="button" disabled={pagination.current_page <= 1} onClick={() => onPageChange(pagination.current_page - 1)}>
        Previous
      </button>
      <span>{pagination.current_page} / {pagination.last_page}</span>
      <button type="button" disabled={pagination.current_page >= pagination.last_page} onClick={() => onPageChange(pagination.current_page + 1)}>
        Next
      </button>
    </div>
  );
}

export default function DashboardHistory({ type = "parking" }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isParking = type === "parking";
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const params = { paginate: 1, status: "history", page, per_page: 8 };
        const response = isParking
          ? await bookingAPI.getAll(params)
          : await serviceOrdersAPI.getUserOrders(params);

        setRecords(isParking ? response.data?.bookings || [] : response.data?.data || []);
        setPagination(response.data?.pagination || emptyPagination);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
          return;
        }
        showErrorToast("History unavailable", "Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isParking, navigate, page]);

  const handleDownloadTicket = async (booking) => {
    try {
      setActionLoading(booking.id);
      const response = await bookingAPI.downloadTicket(booking.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${booking.ticket_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccessToast("Ticket downloaded", "Ticket downloaded successfully!");
    } catch (error) {
      showErrorToast("Download failed", error.response?.status === 404 ? "Ticket not found or not available for download" : "Failed to download ticket");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <section className="dashboard-tabs">
          <div className="dashboard-panel-head">
            <div>
              <h2>{isParking ? "Parking History" : "Car Service History"}</h2>
            </div>
            <button type="button" onClick={() => navigate("/dashboard")}>
              <RiArrowLeftLine />
              Dashboard
            </button>
          </div>

          {loading ? (
            <div className="dashboard-loading-state">Loading history...</div>
          ) : records.length > 0 ? (
            <>
              <div className="dashboard-history-list">
                {isParking
                  ? records.map((booking) => (
                      <article key={booking.id} className="dashboard-history-card">
                        <div>
                          <h3>{booking.parking?.name || "Parking Location"}</h3>
                          <p>Slot {booking.slot?.slot_code || "N/A"} • {formatDate(booking.created_at)}</p>
                        </div>
                        <div>
                          <strong>{formatMoney(booking.grand_total || booking.total_price)}</strong>
                          <small>{normalizeStatus(booking.status)}</small>
                        </div>
                        {booking.ticket_number && (
                          <button type="button" onClick={() => setSelectedTicket(booking)}>
                            <RiTicket2Line />
                            View Ticket
                          </button>
                        )}
                      </article>
                    ))
                  : records.map((order) => (
                      <article key={order.id} className="dashboard-history-card">
                        <div>
                          <h3>{order.service?.name || "Car Service"}</h3>
                          <p>{order.service?.duration || "Duration"} • {formatDate(order.booking_time)}</p>
                        </div>
                        <div>
                          <strong>{formatMoney(order.service?.price)}</strong>
                          <small>{normalizeStatus(order.status)}</small>
                        </div>
                      </article>
                    ))}
              </div>
              <DashboardPagination pagination={pagination} onPageChange={setPage} />
            </>
          ) : (
            <div className="dashboard-empty compact">
                  <RiFileList3Line />
                  <h3>No history found</h3>
                  <p>{isParking ? "Completed parking records will appear here." : "Completed service records will appear here."}</p>
                </div>
              )}

          {selectedTicket && (
            <div className="dashboard-modal" role="dialog" aria-modal="true">
              <div className="dashboard-ticket">
                <div className="dashboard-ticket-head">
                  <div>
                    <span>Parking Ticket</span>
                    <h2>{selectedTicket.ticket_number || "MONARK Ticket"}</h2>
                  </div>
                  <button type="button" onClick={() => setSelectedTicket(null)}>Close</button>
                </div>

                <div className="dashboard-ticket-grid">
                  <div>
                    <span>User</span>
                    <strong>{user?.name || "User"}</strong>
                  </div>
                  <div>
                    <span>Parking</span>
                    <strong>{selectedTicket.parking?.name || "Parking Location"}</strong>
                  </div>
                  <div>
                    <span>Slot</span>
                    <strong>{selectedTicket.slot?.slot_code || "N/A"}</strong>
                  </div>
                  <div>
                    <span>Duration</span>
                    <strong>{selectedTicket.hours} hour(s)</strong>
                  </div>
                  <div>
                    <span>Check-in</span>
                    <strong>{formatDate(selectedTicket.created_at)}</strong>
                  </div>
                  <div>
                    <span>Check-out</span>
                    <strong>{formatDate(selectedTicket.actual_end_time)}</strong>
                  </div>
                </div>

                <div className="dashboard-ticket-total">
                  <span>Total Amount</span>
                  <strong>{formatMoney(Number.parseFloat(selectedTicket.total_price || 0) + Number.parseFloat(selectedTicket.extra_charges || 0))}</strong>
                </div>

                <button
                  type="button"
                  className="dashboard-download"
                  onClick={() => handleDownloadTicket(selectedTicket)}
                  disabled={actionLoading === selectedTicket.id}
                >
                  <RiDownload2Line />
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
