import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiInboxLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiShieldUserLine,
  RiUser3Line,
} from "react-icons/ri";
import { FiEdit } from "react-icons/fi";
import api from "../../api/client";
import AdminFilterBar from "./components/AdminFilterBar";
import AdminPagination from "./components/AdminPagination";
import { AuthContext } from "../../contexts/AuthContext";
import { hasPermission } from "../../utils/permissions";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/UserAdmin.css";

export default function AdminRoles() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [roles, setRoles] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRoles = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const response = await api.get("/admin/roles", {
        params: {
          page: targetPage,
          per_page: 10,
          q: q || undefined,
          status: statusFilter || undefined,
        },
      });

      const payload = response.data?.data;
      if (response.data?.success && payload) {
        setRoles(payload.data || []);
        setMeta({
          current_page: payload.current_page || 1,
          last_page: payload.last_page || 1,
          per_page: payload.per_page || 10,
          total: payload.total || 0,
        });
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Roles fetch error:", error.response?.data || error.message);
      setRoles([]);
      showErrorToast("Failed to load roles", error.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    fetchRoles(page);
  }, [fetchRoles, page]);

  const stats = useMemo(() => {
    const active = roles.filter((role) => role.is_active).length;
    const system = roles.filter((role) => role.is_system).length;
    return [
      { label: "Total Roles", value: meta.total, icon: <RiShieldUserLine /> },
      { label: "Active Roles", value: active, icon: <RiShieldCheckLine /> },
      { label: "System Roles", value: system, icon: <RiUser3Line /> },
    ];
  }, [meta.total, roles]);

  const canCreate = hasPermission(user, "roles.create");
  const canUpdate = hasPermission(user, "roles.update");
  const canDelete = hasPermission(user, "roles.delete");

  const handleDelete = async (role) => {
    const result = await Swal.fire({
      title: "Delete role?",
      text: `${role.name} will be removed if no users are assigned to it.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#00b8c4",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await api.delete(`/admin/roles/${role.id}`);
      if (response.data?.success) {
        showSuccessToast("Role deleted", response.data.message);
        fetchRoles(page);
      }
    } catch (error) {
      showErrorToast("Delete failed", error.response?.data?.message || "Please try again.");
    }
  };

  const handleToggleStatus = async (role) => {
    if (["admin", "user"].includes(role.slug)) {
      showErrorToast("Status locked", "Admin and user roles must stay active.");
      return;
    }

    const nextStatus = !role.is_active;
    const result = await Swal.fire({
      title: nextStatus ? "Activate role?" : "Deactivate role?",
      text: nextStatus
        ? `${role.name} will be available for staff access.`
        : `${role.name} users will lose role-based admin access.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: nextStatus ? "Yes, activate" : "Yes, deactivate",
      cancelButtonText: "Cancel",
      confirmButtonColor: nextStatus ? "#047857" : "#b45309",
      cancelButtonColor: "#00b8c4",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await api.put(`/admin/roles/${role.id}`, {
        name: role.name,
        slug: role.slug,
        description: role.description || null,
        is_active: nextStatus,
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
      });

      if (response.data?.success) {
        showSuccessToast(role.is_active ? "Role deactivated" : "Role activated", response.data.message);
        fetchRoles(page);
      }
    } catch (error) {
      showErrorToast("Status update failed", error.response?.data?.message || "Please try again.");
    }
  };

  const handleRefresh = () => {
    setQ("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <section className="parking-admin-page service-admin-page users-admin-page roles-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Roles Management</h1>
        </div>
        <div className="parking-admin-actions">
          <button className="pa-btn pa-btn-ghost" type="button" onClick={handleRefresh} disabled={loading}>
            <RiRefreshLine /> Refresh
          </button>
          {canCreate && (
            <button className="pa-btn pa-btn-primary" type="button" onClick={() => navigate("/admin/roles/new")}>
              <RiAddLine /> Add Role
            </button>
          )}
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
        searchPlaceholder="Search role name, slug, or description"
        onSearchChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        filters={[
          {
            id: "status",
            label: "Role Status",
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setPage(1);
            },
            options: [
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="pa-empty-state">
            <RiInboxLine />
            <h3>No roles found</h3>
            <p>{q || statusFilter ? "No roles match your filters." : "Create roles to organize access from admin panel."}</p>
          </div>
        ) : (
          <div className="pa-table-wrap">
            <table className="pa-table roles-table">
              <thead>
                <tr>
                  <th className="text-center">#</th>
                  <th>Role</th>
                  <th>Slug</th>
                  <th>Users</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="users-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, index) => (
                  <tr key={role.id}>
                    <td className="text-center">
                      <span className="roles-count">{((meta.current_page || 1) - 1) * (meta.per_page || 10) + index + 1}</span>
                    </td>
                    <td>
                      <div className="roles-identity">
                        <div>
                          <strong>{role.name}</strong>                          
                        </div>
                      </div>
                    </td>
                    <td className="text-center"><span className="roles-code">{role.slug}</span></td>
                    <td className="text-center"><span className="font-semibold">{role.users_count || 0}</span></td>
                    <td className="text-center">
                      <span className={`pa-status ${role.is_system ? "is-live" : "is-soft"}`}>{role.is_system ? "System" : "Custom"}</span>
                    </td>
                    <td className="text-center">
                      <span className={`pa-status ${role.is_active ? "is-live" : "is-danger"}`}>{role.is_active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="text-center">
                      <div className="pa-row-actions users-row-actions">
                        {canUpdate && (
                          <button className="pa-icon-btn users-action-btn" type="button" onClick={() => navigate(`/admin/roles/${role.id}/edit`)} title="Edit role">
                            <FiEdit />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            className={`pa-icon-btn users-action-btn ${role.is_active ? "is-warning" : "is-success"}`}
                            type="button"
                            onClick={() => handleToggleStatus(role)}
                            disabled={["admin", "user"].includes(role.slug)}
                            title={role.is_active ? "Deactivate role" : "Activate role"}
                          >
                            {role.is_active ? <RiCloseCircleLine /> : <RiCheckboxCircleLine />}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="pa-icon-btn users-action-btn is-danger"
                            type="button"
                            onClick={() => handleDelete(role)}
                            disabled={role.is_system || Number(role.users_count || 0) > 0}
                            title={role.is_system ? "System role cannot be deleted" : "Delete role"}
                          >
                            <RiDeleteBin6Line />
                          </button>
                        )}
                        {!canUpdate && !canDelete && <span className="pa-cell-note">View only</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <AdminPagination currentPage={meta.current_page} lastPage={meta.last_page} perPage={meta.per_page} total={meta.total} label="roles" onPageChange={setPage} />
        )}
      </div>
    </section>
  );
}
