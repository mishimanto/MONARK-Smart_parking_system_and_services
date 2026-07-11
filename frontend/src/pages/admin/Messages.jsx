import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  RiCloseLine,
  RiDeleteBin6Line,
  RiEyeLine,
  RiInboxLine,
  RiMailLine,
  RiMailOpenLine,
  RiMailUnreadLine,
  RiRefreshLine,
  RiReplyLine,
  RiTimeLine,
  RiUser3Line,
} from "react-icons/ri";
import { API_BASE_URL, bulkDeleteAdminResource } from "../../api/client";
import AdminBulkActions from "./components/AdminBulkActions";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import useBulkSelection from "./utils/useBulkSelection";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/CommunicationsAdmin.css";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [stats, setStats] = useState({ unread: 0, read: 0, replied: 0 });
  const bulk = useBulkSelection(messages);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: "10",
      });
      if (q) params.set("q", q);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`${API_BASE_URL}/messages?${params.toString()}`, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch messages");
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data?.data)) {
        setMessages(data.data.data);
        setPagination({
          current_page: data.data.current_page || 1,
          last_page: data.data.last_page || 1,
          per_page: data.data.per_page || 10,
          total: data.data.total || 0,
        });
        setStats(data.stats || { unread: 0, read: 0, replied: 0 });
      } else if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: data.data.length,
          total: data.data.length,
        });
      } else if (Array.isArray(data)) {
        setMessages(data);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: data.length,
          total: data.length,
        });
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
      setError(err.message || "Failed to load messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, getHeaders, q, statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const closeModal = useCallback(() => {
    setIsModalClosing(true);
    window.setTimeout(() => {
      setShowModal(false);
      setSelectedMessage(null);
      setIsModalClosing(false);
    }, 180);
  }, []);

  useEffect(() => {
    if (!showModal) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeModal, showModal]);

  const markAsRead = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: "PUT",
        headers: getHeaders(),
      });

      if (response.ok) {
        setMessages((items) => items.map((msg) => (
          msg.id === messageId ? { ...msg, status: "read" } : msg
        )));
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          read: prev.read + 1,
        }));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage((prev) => ({ ...prev, status: "read" }));
        }
      }
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const deleteMessage = async (messageId) => {
    const result = await Swal.fire({
      title: "Delete message?",
      text: "This message will be removed permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (!response.ok) throw new Error("Failed to delete message");

      fetchMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
        setShowModal(false);
      }
      showSuccessToast("Deleted", "Message removed successfully.");
    } catch (err) {
      console.error("Error deleting message:", err);
      showErrorToast("Failed to delete message", "Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${bulk.selectedCount} messages?`,
      text: "Selected messages will be removed permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete selected",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await bulkDeleteAdminResource("messages", bulk.selectedNumericIds);
      if (selectedMessage && bulk.selectedIds.includes(String(selectedMessage.id))) {
        setSelectedMessage(null);
        setShowModal(false);
      }
      bulk.clearSelection();
      showSuccessToast("Bulk delete complete", response.message);
      fetchMessages();
    } catch (err) {
      console.error("Bulk delete messages error:", err);
      showErrorToast("Bulk delete failed", err.response?.data?.message || "Please try again.");
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setIsModalClosing(false);
    setShowModal(true);
    if (message.status === "unread") markAsRead(message.id);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusClass = (status) => {
    if (status === "unread") return "is-pending";
    if (status === "read") return "is-live";
    if (status === "replied") return "is-confirmed";
    return "is-soft";
  };

  const statCards = [
    { label: "Total Messages", value: pagination.total, icon: <RiInboxLine /> },
    { label: "Unread Messages", value: stats.unread, icon: <RiMailUnreadLine /> },
    { label: "Read Messages", value: stats.read, icon: <RiMailOpenLine /> },
    { label: "Replied Messages", value: stats.replied, icon: <RiReplyLine /> },
  ];

  return (
    <section className="parking-admin-page service-admin-page communications-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Messages</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={fetchMessages} disabled={loading}>
          <RiRefreshLine /> Refresh
        </button>
      </div>

      {error && (
        <div className="comm-alert">
          <strong>Error</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      <div className="pa-stat-grid">
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
        searchValue={q}
        searchPlaceholder="Search by name, email, subject, or message"
        onSearchChange={(value) => {
          setQ(value);
          setCurrentPage(1);
        }}
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
            options: [
              { value: "", label: "All Status" },
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
              { value: "replied", label: "Replied" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="pa-empty-state">
            <RiInboxLine />
            <h3>No messages found</h3>
            <p>Customer messages will appear here.</p>
          </div>
        ) : (
          <>
          <AdminBulkActions
            selectedCount={bulk.selectedCount}
            totalCount={messages.length}
            label="messages"
            onToggleAll={bulk.toggleAllVisible}
            onClear={bulk.clearSelection}
            onDelete={handleBulkDelete}
          />
          <div className="pa-table-wrap">
            <table className="pa-table comm-table">
              <thead>
                <tr>
                  <th className="pa-select-col">Select</th>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th className="comm-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr key={message.id} className={message.status === "unread" ? "comm-unread-row" : ""}>
                    <td className="pa-select-col">
                      <label className="pa-row-check" title={`Select message from ${message.name}`}>
                        <input type="checkbox" checked={bulk.isSelected(message.id)} onChange={() => bulk.toggleSelection(message.id)} />
                      </label>
                    </td>
                    <td className="text-center">
                      <span className={`pa-status ${getStatusClass(message.status)}`}>
                        {message.status || "unread"}
                      </span>
                    </td>
                    <td>
                      <span className="pa-icon-text"><RiUser3Line /> {message.name}</span>
                    </td>
                    <td>
                      <span className="pa-icon-text"><RiMailLine /> {message.email}</span>
                    </td>
                    <td className="text-center"><strong>{message.subject || "No Subject"}</strong></td>
                    <td className="text-center">
                      <span className="pa-icon-text"><RiTimeLine /> {formatDate(message.created_at)}</span>
                    </td>
                    <td className="text-center">
                      <div className="pa-row-actions comm-row-actions">
                        <button className="pa-icon-btn" type="button" onClick={() => handleMessageClick(message)} title="View Message">
                          <RiEyeLine />
                        </button>
                        <button className="pa-icon-btn is-danger" type="button" onClick={() => deleteMessage(message.id)} title="Delete Message">
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              perPage={pagination.per_page}
              total={pagination.total}
              showing={messages.length}
              label="messages"
              onPageChange={setCurrentPage}
            />
          </div>
          </>
        )}
      </div>

      {showModal && selectedMessage && (
        <div
          className={`comm-modal-backdrop ${isModalClosing ? "is-closing" : ""}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className={`comm-modal ${isModalClosing ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="comm-modal-head">
              <div>
                <span className="parking-admin-kicker">Message Details</span>
                <h3 id="message-modal-title">{selectedMessage.subject || "No Subject"}</h3>
              </div>
              <button className="comm-modal-close" type="button" onClick={closeModal} aria-label="Close message details">
                <RiCloseLine />
              </button>
            </div>
            <div className="comm-modal-meta">
              <div className="comm-meta-card">
                <span><RiUser3Line /> From</span>
                <strong>{selectedMessage.name}</strong>
                <p>{selectedMessage.email}</p>
              </div>
              <div className="comm-meta-card">
                <span><RiTimeLine /> Received</span>
                <strong>{formatDate(selectedMessage.created_at)}</strong>
                <p className={`pa-status ${getStatusClass(selectedMessage.status)}`}>{selectedMessage.status}</p>
              </div>
            </div>
            <div className="comm-message-body">
              <span>Message</span>
              <p>{selectedMessage.message}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
