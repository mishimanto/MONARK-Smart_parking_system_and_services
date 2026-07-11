import React, { useCallback, useMemo, useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  RiDeleteBin6Line,
  RiForbidLine,
  RiInboxLine,
  RiLockUnlockLine,
  RiRefreshLine,
  RiTimeLine,
  RiUser3Line,
  RiUserFollowLine,
} from "react-icons/ri";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { API_BASE_URL, bulkDeleteAdminResource, getStoredToken } from "../../api/client";
import AdminBulkActions from "./components/AdminBulkActions";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import useBulkSelection from "./utils/useBulkSelection";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/UserAdmin.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [emailStatusFilter, setEmailStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        params: {
          page: p,
          per_page: perPage,
          q: q || undefined,
          status: statusFilter || undefined,
          email_status: emailStatusFilter || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data.success) {
        setUsers(res.data.data.data);
        setMeta({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          per_page: res.data.data.per_page,
          total: res.data.data.total,
        });
      } else {
        setUsers([]);
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [emailStatusFilter, perPage, q, statusFilter]);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const handleSearchChange = useCallback((value) => {
    setQ(value);
    setPage(1);
  }, []);

  const handleRefresh = () => {
    setQ("");
    setStatusFilter("");
    setEmailStatusFilter("");
    setPage(1);
  };

  const handleBlockUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: "Block user?",
      text: `Are you sure you want to block "${userName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, block",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setActionLoading(userId);
    try {
      const token = getStoredToken();
      const res = await axios.put(`${API_BASE_URL}/admin/users/${userId}/block`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data.success) {
        setUsers((items) => items.map((user) => (
          user.id === userId ? { ...user, is_blocked: true } : user
        )));
        showSuccessToast("Blocked", `${userName} has been blocked.`);
      }
    } catch (err) {
      console.error("Error blocking user:", err.response?.data || err.message);
      showErrorToast("Failed to block user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: "Unblock user?",
      text: `Are you sure you want to unblock "${userName}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, unblock",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#00b8c4",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setActionLoading(userId);
    try {
      const token = getStoredToken();
      const res = await axios.put(`${API_BASE_URL}/admin/users/${userId}/unblock`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data.success) {
        setUsers((items) => items.map((user) => (
          user.id === userId ? { ...user, is_blocked: false } : user
        )));
        showSuccessToast("Unblocked", `${userName} has been unblocked.`);
      }
    } catch (err) {
      console.error("Error unblocking user:", err.response?.data || err.message);
      showErrorToast("Failed to unblock user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const result = await Swal.fire({
      title: "Delete user?",
      text: `This will permanently delete "${userName}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setActionLoading(userId);
    try {
      const token = getStoredToken();
      const res = await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data.success) {
        setUsers((items) => items.filter((user) => user.id !== userId));
        showSuccessToast("Deleted", `${userName} has been deleted.`);
      }
    } catch (err) {
      console.error("Error deleting user:", err.response?.data || err.message);
      showErrorToast("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const stats = useMemo(() => {
    const active = users.filter((user) => !user.is_blocked).length;
    const blocked = users.filter((user) => user.is_blocked).length;
    const visibleWallet = users.reduce((sum, user) => sum + Number(user.wallet_balance || 0), 0);
    return { active, blocked, visibleWallet };
  }, [users]);
  const bulk = useBulkSelection(users);

  const statCards = [
    { label: "Total Users", value: meta.total, icon: <RiUser3Line /> },
    { label: "Active Users", value: stats.active, icon: <RiUserFollowLine /> },
    { label: "Wallet", value: formatCurrency(stats.visibleWallet), icon: <FaBangladeshiTakaSign /> },
  ];

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${bulk.selectedCount} users?`,
      text: "Only regular users will be deleted. Protected users will be skipped.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete selected",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#64748b",
    });
    if (!result.isConfirmed) return;

    setActionLoading("bulk");
    try {
      const response = await bulkDeleteAdminResource("users", bulk.selectedNumericIds);
      bulk.clearSelection();
      showSuccessToast("Bulk delete complete", response.message);
      fetchUsers(page);
    } catch (err) {
      showErrorToast("Bulk delete failed", err.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <section className="parking-admin-page service-admin-page users-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Regular Users</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={handleRefresh}>
          <RiRefreshLine /> Refresh
        </button>
      </div>

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
        searchPlaceholder="Search by user name, email, or ID"
        onSearchChange={handleSearchChange}
        filters={[
          {
            id: "status",
            label: "Account Status",
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setPage(1);
            },
            options: [
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "blocked", label: "Blocked" },
            ],
          },
          {
            id: "email_status",
            label: "Email Status",
            value: emailStatusFilter,
            onChange: (value) => {
              setEmailStatusFilter(value);
              setPage(1);
            },
            options: [
              { value: "", label: "All Email" },
              { value: "verified", label: "Verified" },
              { value: "unverified", label: "Unverified" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading users data...</div>
        ) : users.length === 0 ? (
          <div className="pa-empty-state">
            <RiInboxLine />
            <h3>No users found</h3>
            <p>{q || statusFilter || emailStatusFilter ? "No users match your filters." : "There are no regular users in the system yet."}</p>
            {(q || statusFilter || emailStatusFilter) && (
              <button className="pa-btn pa-btn-primary" type="button" onClick={handleRefresh}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
          <AdminBulkActions
            selectedCount={bulk.selectedCount}
            totalCount={users.length}
            label="regular users"
            disabled={actionLoading === "bulk"}
            onToggleAll={bulk.toggleAllVisible}
            onClear={bulk.clearSelection}
            onDelete={handleBulkDelete}
          />
          <div className="pa-table-wrap">
            <table className="pa-table users-table">
              <thead>
                <tr>
                  <th className="pa-select-col">Select</th>
                  <th>User</th>
                  <th>Wallet Balance</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th>Total Bookings</th>
                  <th className="users-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="pa-select-col">
                      <label className="pa-row-check" title={`Select ${user.name}`}>
                        <input type="checkbox" checked={bulk.isSelected(user.id)} onChange={() => bulk.toggleSelection(user.id)} />
                      </label>
                    </td>
                    <td>
                      <div className="users-identity">
                        <span className="users-avatar">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
                        <div>
                          <strong>{user.name}</strong>
                          <span className="pa-cell-note">#{user.id} · {user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="pa-price">
                      <span className="pa-price-value">
                        {formatCurrency(user.wallet_balance)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`pa-status ${user.is_blocked ? "is-danger" : "is-live"}`}>
                        {user.is_blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="pa-icon-text">
                        <RiTimeLine /> {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-gray-600 font-semibold is-soft">
                        {user.bookings_count || 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="pa-row-actions users-row-actions">
                        {user.is_blocked ? (
                          <button
                            className="pa-icon-btn users-action-btn is-confirm"
                            type="button"
                            onClick={() => handleUnblockUser(user.id, user.name)}
                            disabled={actionLoading === user.id || user.role !== "user"}
                            title="Unblock user"
                          >
                            <RiLockUnlockLine />
                          </button>
                        ) : (
                          <button
                            className="pa-icon-btn users-action-btn"
                            type="button"
                            onClick={() => handleBlockUser(user.id, user.name)}
                            disabled={actionLoading === user.id || user.role !== "user"}
                            title="Block user"
                          >
                            <RiForbidLine />
                          </button>
                        )}

                        <button
                          className="pa-icon-btn users-action-btn is-danger"
                          type="button"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={actionLoading === user.id || user.role !== "user"}
                          title="Delete user"
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

        {!loading && (
          <AdminPagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            perPage={meta.per_page}
            total={meta.total}
            label="regular users"
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
}
