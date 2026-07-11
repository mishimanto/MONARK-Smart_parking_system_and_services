import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RiArrowLeftLine, RiSave3Line, RiShieldUserLine } from "react-icons/ri";
import api from "../../api/client";
import { PERMISSIONS } from "../../utils/permissions";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/UserAdmin.css";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  is_active: true,
  permissions: [],
};

export default function AdminRoleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [role, setRole] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const groupedPermissions = useMemo(() => {
    return PERMISSIONS.reduce((groups, permission) => {
      if (!groups[permission.group]) groups[permission.group] = [];
      groups[permission.group].push(permission);
      return groups;
    }, {});
  }, []);

  const fetchRole = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);

    try {
      const response = await api.get(`/admin/roles/${id}`);
      const payload = response.data?.data;

      if (response.data?.success && payload) {
        setRole(payload);
        setForm({
          name: payload.name || "",
          slug: payload.slug || "",
          description: payload.description || "",
          is_active: Boolean(payload.is_active),
          permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
        });
      }
    } catch (error) {
      showErrorToast("Failed to load role", error.response?.data?.message || "Please try again.");
      navigate("/admin/roles", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, navigate]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const togglePermission = (permission) => {
    setForm((current) => {
      const selected = new Set(current.permissions || []);
      if (selected.has(permission)) {
        selected.delete(permission);
      } else {
        selected.add(permission);
      }
      return { ...current, permissions: Array.from(selected) };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        is_active: form.is_active,
        permissions: form.permissions || [],
      };

      const response = isEdit
        ? await api.put(`/admin/roles/${id}`, payload)
        : await api.post("/admin/roles", payload);

      if (response.data?.success) {
        showSuccessToast(isEdit ? "Role updated" : "Role created", response.data.message);
        navigate("/admin/roles");
      }
    } catch (error) {
      showErrorToast("Save failed", error.response?.data?.message || "Please check the role form.");
    } finally {
      setSaving(false);
    }
  };

  const isAdminRole = role?.slug === "admin";
  const isStatusProtected = ["admin", "user"].includes(role?.slug);

  return (
    <section className="parking-admin-page service-admin-page users-admin-page roles-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>{isEdit ? "Edit Role" : "Add Role"}</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={() => navigate("/admin/roles")}>
          <RiArrowLeftLine /> Back to Roles
        </button>
      </div>

      {loading ? (
        <div className="pa-panel">
          <div className="pa-empty-state">Loading role...</div>
        </div>
      ) : (
        <form className="pa-panel roles-form-panel" onSubmit={handleSubmit}>
          <div className="roles-form-head">
            <div className="roles-form-title">
              <span className="roles-avatar"><RiShieldUserLine /></span>
              <div>
                <h2>{isEdit ? role?.name : "New Role"}</h2>               
              </div>
            </div>
          </div>

          <div className="roles-form-grid">
            <label className="pa-field">
              <span>Role Name</span>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Support Manager" required />
            </label>

            <label className="pa-field">
              <span>Slug</span>
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="support_manager" disabled={Boolean(role?.is_system)} />
            </label>

            <label className="pa-field roles-description-field">
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Short permission summary" rows="3" />
            </label>

            <label className={`roles-toggle ${form.is_active ? "is-active" : ""}`}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} disabled={isStatusProtected} />
              <span>{form.is_active ? "Active" : "Inactive"}</span>
            </label>
          </div>

          <div className="roles-permission-panel">
            <div>
              <h3>Permissions</h3>
              <p>{isAdminRole ? "Admin has full access. Permission toggles are locked." : "Choose exactly which modules and actions this role can access."}</p>
            </div>
            <div className="roles-permission-groups">
              {Object.entries(groupedPermissions).map(([group, permissions]) => (
                <section className="roles-permission-group" key={group}>
                  <h4>{group}</h4>
                  <div className="roles-permission-grid">
                    {permissions.map((permission) => (
                      <label className="roles-permission-check" key={permission.key}>
                        <input
                          type="checkbox"
                          checked={isAdminRole || form.permissions?.includes(permission.key)}
                          disabled={isAdminRole}
                          onChange={() => togglePermission(permission.key)}
                        />
                        <span>{permission.label}</span>
                        <small>{permission.key}</small>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="roles-form-actions">
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving}>
              <RiSave3Line /> {saving ? "Saving..." : isEdit ? "Update Role" : "Save Role"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
