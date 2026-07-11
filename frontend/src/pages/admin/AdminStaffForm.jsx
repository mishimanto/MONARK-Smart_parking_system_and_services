import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiLockPasswordLine,
  RiMailLine,
  RiSave3Line,
  RiShieldUserLine,
  RiUser3Line,
} from "react-icons/ri";
import { API_BASE_URL, getStoredToken } from "../../api/client";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/UserAdmin.css";

const emptyForm = {
  name: "",
  email: "",
  role: "",
  password: "",
  password_confirmation: "",
  is_blocked: false,
  email_verified: true,
};

export default function AdminStaffForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getStoredToken()}`,
      Accept: "application/json",
    }),
    []
  );

  const staffRoles = useMemo(() => roles.filter((role) => role.slug !== "user" && role.is_active), [roles]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/roles`, {
        params: { all: 1 },
        headers: authHeaders,
      });

      if (response.data?.success) {
        const activeStaffRoles = (response.data.data || []).filter((role) => role.slug !== "user" && role.is_active);
        setRoles(response.data.data || []);
        setFormData((current) => ({
          ...current,
          role: current.role || activeStaffRoles[0]?.slug || "",
        }));
      }
    } catch (error) {
      showErrorToast("Failed to load roles", error.response?.data?.message || "Please try again.");
    }
  }, [authHeaders]);

  const fetchStaff = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/staff/${id}`, {
        headers: authHeaders,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Staff not found");
      }

      const staff = response.data.data;
      setFormData({
        name: staff.name || "",
        email: staff.email || "",
        role: staff.role || "",
        password: "",
        password_confirmation: "",
        is_blocked: Boolean(staff.is_blocked),
        email_verified: Boolean(staff.email_verified_at),
      });
    } catch (error) {
      showErrorToast("Failed to load staff", error.response?.data?.message || error.message || "Please try again.");
      navigate("/admin/staff");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, id, isEdit, navigate]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.role) {
      showErrorToast("Select a staff role");
      return;
    }

    if (!isEdit && !formData.password) {
      showErrorToast("Password is required for new staff");
      return;
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      showErrorToast("Password confirmation does not match");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_blocked: formData.is_blocked,
        email_verified: formData.email_verified,
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const response = isEdit
        ? await axios.put(`${API_BASE_URL}/admin/staff/${id}`, payload, { headers: authHeaders })
        : await axios.post(`${API_BASE_URL}/admin/staff`, payload, { headers: authHeaders });

      if (response.data?.success) {
        showSuccessToast(isEdit ? "Staff updated" : "Staff created", response.data.message);
        navigate("/admin/staff");
      }
    } catch (error) {
      const errors = error.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      showErrorToast("Save failed", firstError || error.response?.data?.message || "Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="parking-admin-page"><div className="pa-empty-state">Loading staff form...</div></section>;
  }

  return (
    <section className="parking-admin-page service-admin-page staff-form-page">
      <div className="parking-admin-hero">
        <div>
          <h1>{isEdit ? "Edit Staff" : "Add Staff"}</h1>
        </div>
        <Link className="pa-link-action" to="/admin/staff">
          <RiArrowLeftLine /> Back to staff
        </Link>
      </div>

      <form className="pa-form-layout is-compact staff-form-layout" onSubmit={handleSubmit}>
        <aside className="pa-form-preview staff-form-preview">
          <div className="staff-preview-avatar">
            {(formData.name || "S").charAt(0).toUpperCase()}
          </div>
          <h2>{formData.name || "Staff Member"}</h2>
          <p>{formData.email || "staff@example.com"}</p>
          <span>{staffRoles.find((role) => role.slug === formData.role)?.name || "Staff Role"}</span>
        </aside>

        <div className="pa-form-panel">
          <div className="pa-form-grid">
            <label className="pa-field">
              <span>Name</span>
              <input value={formData.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Staff full name" required />
            </label>

            <label className="pa-field">
              <span>Email</span>
              <input type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} placeholder="staff@example.com" required />
            </label>

            <label className="pa-field staff-role-field">
              <span>Role</span>
              <select value={formData.role} onChange={(event) => updateField("role", event.target.value)} required>
                <option value="" disabled>Select role</option>
                {staffRoles.map((role) => (
                  <option key={role.slug} value={role.slug}>{role.name}</option>
                ))}
              </select>
            </label>

            <label className="pa-field">
              <span>{isEdit ? "New Password" : "Password"}</span>
              <input
                type="password"
                value={formData.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder={isEdit ? "Leave blank to keep current" : "Minimum 6 characters"}
                required={!isEdit}
              />
            </label>

            <label className="pa-field">
              <span>Confirm Password</span>
              <input
                type="password"
                value={formData.password_confirmation}
                onChange={(event) => updateField("password_confirmation", event.target.value)}
                placeholder="Repeat password"
                required={!isEdit || Boolean(formData.password)}
              />
            </label>

            <label className="pa-toggle-field">
              <input type="checkbox" checked={formData.email_verified} onChange={(event) => updateField("email_verified", event.target.checked)} />
              <div>
                <strong>Email Verified</strong>
                <small>Staff can sign in without email verification delay.</small>
              </div>
            </label>

            <label className="pa-toggle-field">
              <input type="checkbox" checked={formData.is_blocked} onChange={(event) => updateField("is_blocked", event.target.checked)} />
              <div>
                <strong>Blocked</strong>
                <small>Blocked staff cannot be treated as an active account.</small>
              </div>
            </label>
          </div>

          <div className="staff-form-hints">
            <span><RiUser3Line /> Staff appears only in the Staff section.</span>
            <span><RiShieldUserLine /> Roles are managed from Roles page.</span>
            <span><RiMailLine /> Email must be unique.</span>
            <span><RiLockPasswordLine /> Password update is optional while editing.</span>
          </div>

          <div className="pa-form-footer">
            <Link className="pa-btn pa-btn-ghost" to="/admin/staff">Cancel</Link>
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving}>
              <RiSave3Line /> {saving ? "Saving..." : isEdit ? "Update Staff" : "Create Staff"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
