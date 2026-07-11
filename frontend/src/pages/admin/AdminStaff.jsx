import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiForbidLine,
  RiInboxLine,
  RiLockUnlockLine,
  RiRefreshLine,
  RiShieldUserLine,
  RiTimeLine,
  RiUser3Line,
  RiUserFollowLine,
} from "react-icons/ri";
import { API_BASE_URL, getStoredToken } from "../../api/client";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { AuthContext } from "../../contexts/AuthContext";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/UserAdmin.css";

export default function AdminStaff() {
  const { user: currentUser } = useContext(AuthContext);
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [emailStatusFilter, setEmailStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRoles = useCallback(async () => {
    try {
      const token = getStoredToken();
      const res = await axios.get(`${API_BASE_URL}/admin/roles`, {
        params: { all: 1 },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data.success) {
        setRoles(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching roles:", err.response?.data || err.message);
    }
  }, []);

  const fetchStaff = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const token = getStoredToken();
      const res = await axios.get(`${API_BASE_URL}/admin/staff`, {
        params: {
          page: targetPage,
          per_page: 10,
          q: q || undefined,
          status: statusFilter || undefined,
          email_status: emailStatusFilter || undefined,
          role: roleFilter || "all",
        },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.data.success) {
        setStaff(res.data.data.data || []);
        setMeta({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          per_page: res.data.data.per_page,
          total: res.data.data.total,
        });
      } else {
        setStaff([]);
      }
    } catch (err) {
      console.error("Error fetching staff:", err.response?.data || err.message);
      setStaff([]);
      showErrorToast("Failed to load staff", err.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [emailStatusFilter, q, roleFilter, statusFilter]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchStaff(page);
  }, [fetchStaff, page]);

  const staffRoles = useMemo(() => roles.filter((role) => role.slug !== "user"), [roles]);

  const handleRefresh = () => {
    setQ("");
    setStatusFilter("");
    setEmailStatusFilter("");
    setRoleFilter("all");
    setPage(1);
  };

  const handleBlockStaff = async (item) => {
    const result = await Swal.fire({
      title: "Block staff?",
      text: `${item.name} will lose active staff access.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, block",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setActionLoading(`block-${item.id}`);
    try {
      const token = getStoredToken();
      const response = await axios.put(`${API_BASE_URL}/admin/staff/${item.id}/block`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.data?.success) {
        setStaff((items) => items.map((staffItem) => (
          staffItem.id === item.id ? { ...staffItem, is_blocked: true } : staffItem
        )));
        showSuccessToast("Staff blocked", response.data.message);
      }
    } catch (err) {
      showErrorToast("Block failed", err.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockStaff = async (item) => {
    const result = await Swal.fire({
      title: "Unblock staff?",
      text: `${item.name} will be marked active again.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, unblock",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#00b8c4",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setActionLoading(`unblock-${item.id}`);
    try {
      const token = getStoredToken();
      const response = await axios.put(`${API_BASE_URL}/admin/staff/${item.id}/unblock`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.data?.success) {
        setStaff((items) => items.map((staffItem) => (
          staffItem.id === item.id ? { ...staffItem, is_blocked: false } : staffItem
        )));
        showSuccessToast("Staff unblocked", response.data.message);
      }
    } catch (err) {
      showErrorToast("Unblock failed", err.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStaff = async (item) => {
    const result = await Swal.fire({
      title: "Delete staff?",
      text: `${item.name} will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setActionLoading(`delete-${item.id}`);
    try {
      const token = getStoredToken();
      const response = await axios.delete(`${API_BASE_URL}/admin/staff/${item.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.data?.success) {
        setStaff((items) => items.filter((staffItem) => staffItem.id !== item.id));
        setMeta((current) => ({ ...current, total: Math.max(Number(current.total || 0) - 1, 0) }));
        showSuccessToast("Staff deleted", response.data.message);
      }
    } catch (err) {
      showErrorToast("Delete failed", err.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const stats = useMemo(() => {
    const active = staff.filter((item) => !item.is_blocked).length;
    const visibleRoleCount = new Set(staff.map((item) => item.role).filter(Boolean)).size;
    return [
      { label: "Total Staff", value: meta.total, icon: <RiUser3Line /> },
      { label: "Active Staff", value: active, icon: <RiUserFollowLine /> },
      { label: "Visible Roles", value: visibleRoleCount, icon: <RiShieldUserLine /> },
    ];
  }, [meta.total, staff]);

  const getRoleName = (slug) => roles.find((role) => role.slug === slug)?.name || slug || "Staff";

  return (
    <section className="parking-admin-page service-admin-page users-admin-page staff-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Staff Management</h1>
        </div>
        <div className="parking-admin-actions">
          <button className="pa-btn pa-btn-ghost" type="button" onClick={handleRefresh}>
            <RiRefreshLine /> Refresh
          </button>
          <Link className="pa-link-action" to="/admin/staff/new">
            <RiAddLine /> Add Staff
          </Link>
        </div>
      </div>

      <div className="pa-stat-grid">
        {stats.map((card) => (
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
        searchPlaceholder="Search staff by name, email, or ID"
        onSearchChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        filters={[
          {
            id: "role",
            label: "Role",
            value: roleFilter,
            onChange: (value) => {
              setRoleFilter(value);
              setPage(1);
            },
            clearValue: "all",
            isActive: (value) => value !== "all",
            options: [
              { value: "all", label: "All Staff Roles" },
              ...staffRoles.map((role) => ({ value: role.slug, label: role.name })),
            ],
          },
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
          <div className="pa-empty-state">Loading staff data...</div>
        ) : staff.length === 0 ? (
          <div className="pa-empty-state">
            <RiInboxLine />
            <h3>No staff found</h3>
            <p>{q || statusFilter || emailStatusFilter || roleFilter !== "all" ? "No staff match your filters." : "No staff accounts have been assigned yet."}</p>
            {(q || statusFilter || emailStatusFilter || roleFilter !== "all") && (
              <button className="pa-btn pa-btn-primary" type="button" onClick={handleRefresh}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="pa-table-wrap">
            <table className="pa-table users-table staff-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="users-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="users-identity">
                        <span className="users-avatar">{item.name?.charAt(0)?.toUpperCase() || "S"}</span>
                        <div>
                          <strong>{item.name}</strong>
                          <span className="pa-cell-note">#{item.id} · {item.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="staff-role-badge">{getRoleName(item.role)}</span>
                    </td>
                    <td className="text-center">
                      <span className={`pa-status ${item.is_blocked ? "is-danger" : "is-live"}`}>
                        {item.is_blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="pa-icon-text">
                        <RiTimeLine /> {formatDate(item.created_at)}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="pa-row-actions users-row-actions">
                        <Link className="pa-icon-btn users-action-btn" to={`/admin/staff/${item.id}/edit`} title="Edit staff">
                          <RiEdit2Line />
                        </Link>
                        {item.is_blocked ? (
                          <button
                            className="pa-icon-btn users-action-btn is-confirm"
                            type="button"
                            onClick={() => handleUnblockStaff(item)}
                            disabled={actionLoading === `unblock-${item.id}`}
                            title="Unblock staff"
                          >
                            <RiLockUnlockLine />
                          </button>
                        ) : (
                          <button
                            className="pa-icon-btn users-action-btn is-warning"
                            type="button"
                            onClick={() => handleBlockStaff(item)}
                            disabled={actionLoading === `block-${item.id}` || Number(currentUser?.id) === Number(item.id)}
                            title={Number(currentUser?.id) === Number(item.id) ? "You cannot block yourself" : "Block staff"}
                          >
                            <RiForbidLine />
                          </button>
                        )}
                        <button
                          className="pa-icon-btn users-action-btn is-danger"
                          type="button"
                          onClick={() => handleDeleteStaff(item)}
                          disabled={actionLoading === `delete-${item.id}` || Number(currentUser?.id) === Number(item.id)}
                          title={Number(currentUser?.id) === Number(item.id) ? "You cannot delete yourself" : "Delete staff"}
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
        )}

        {!loading && (
          <AdminPagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            perPage={meta.per_page}
            total={meta.total}
            label="staff"
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
}
