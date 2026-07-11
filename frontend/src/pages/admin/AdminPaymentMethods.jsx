import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiAddLine,
  RiBankCardLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiImageAddLine,
  RiRefreshLine,
  RiSave3Line,
  RiToggleLine,
} from "react-icons/ri";
import Swal from "sweetalert2";
import api, { APP_BASE_URL } from "../../api/client";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/WalletAdmin.css";

const initialForm = {
  name: "",
  type: "mobile_banking",
  account_number: "",
  icon: "",
  is_active: true,
};

const resolveMethodIcon = (icon) => {
  if (!icon) return "";
  const iconValue = String(icon).trim();
  if (!iconValue) return "";
  if (/^https?:\/\//i.test(iconValue) || iconValue.startsWith("/")) return iconValue;
  return `${APP_BASE_URL}/${iconValue.replace(/^\/+/, "")}`;
};

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/payment-methods");
      setMethods(response.data?.success ? response.data.data || [] : []);
    } catch (error) {
      console.error("Payment methods fetch error:", error.response?.data || error.message);
      showErrorToast("Failed to load payment methods", error.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const stats = useMemo(() => {
    const active = methods.filter((method) => method.is_active).length;
    return [
      { label: "Total Methods", value: methods.length, icon: <RiBankCardLine /> },
      { label: "Active Methods", value: active, icon: <RiToggleLine /> },
      { label: "Inactive Methods", value: methods.length - active, icon: <RiCloseLine /> },
    ];
  }, [methods]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (method) => {
    setEditingId(method.id);
    setForm({
      name: method.name || "",
      type: method.type || "mobile_banking",
      account_number: method.account_number || "",
      icon: method.icon || "",
      is_active: Boolean(method.is_active),
    });
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const response = await api.post("/admin/payment-methods/upload-logo", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      if (response.data?.success) {
        setForm((current) => ({
          ...current,
          icon: response.data.data?.url || "",
        }));
        showSuccessToast("Logo uploaded", response.data.message);
      }
    } catch (error) {
      showErrorToast("Logo upload failed", error.response?.data?.message || "Please upload a valid image.");
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        account_number: form.account_number || null,
        icon: form.icon || null,
      };

      const response = editingId
        ? await api.put(`/admin/payment-methods/${editingId}`, payload)
        : await api.post("/admin/payment-methods", payload);

      if (response.data?.success) {
        showSuccessToast(editingId ? "Payment method updated" : "Payment method added", response.data.message);
        resetForm();
        fetchMethods();
      }
    } catch (error) {
      showErrorToast("Save failed", error.response?.data?.message || "Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (method) => {
    try {
      const response = await api.patch(`/admin/payment-methods/${method.id}/toggle`);
      if (response.data?.success) {
        showSuccessToast("Status updated", response.data.message);
        fetchMethods();
      }
    } catch (error) {
      showErrorToast("Status update failed", error.response?.data?.message || "Please try again.");
    }
  };

  const handleDelete = async (method) => {
    const result = await Swal.fire({
      title: "Delete payment method?",
      text: `${method.name} will be removed from topup options.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#00b8c4",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await api.delete(`/admin/payment-methods/${method.id}`);
      if (response.data?.success) {
        showSuccessToast("Payment method deleted", response.data.message);
        if (editingId === method.id) resetForm();
        fetchMethods();
      }
    } catch (error) {
      showErrorToast("Delete failed", error.response?.data?.message || "Please try again.");
    }
  };

  return (
    <section className="parking-admin-page service-admin-page wallet-admin-page payment-methods-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Payment Methods</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={fetchMethods} disabled={loading}>
          <RiRefreshLine /> Refresh
        </button>
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

      <div className="payment-methods-layout">
        <form className="pa-panel payment-method-form" onSubmit={handleSubmit}>
          <div className="wallet-panel-head">
            <div>
              <h2>{editingId ? "Update Method" : "Add Payment Method"}</h2>
            </div>
            {editingId && (
              <button className="pa-mini-btn" type="button" onClick={resetForm}>
                <RiCloseLine /> Cancel
              </button>
            )}
          </div>

          <div className="payment-method-form-body">
            <label>
              <span>Name</span>
              <input name="name" value={form.name} onChange={handleChange} placeholder="bKash Merchant" required />
            </label>

            <label>
              <span>Type</span>
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="mobile_banking">Mobile Banking</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              <span>Account Number</span>
              <input name="account_number" value={form.account_number} onChange={handleChange} placeholder="Merchant number" />
            </label>

            <label>
              <span>Logo URL</span>
              <input name="icon" value={form.icon} onChange={handleChange} placeholder="images/payment/bkash.webp or https://..." />
            </label>

            <div className="payment-logo-upload">
              <span>Upload Logo</span>
              <label>
                {form.icon ? (
                  <img src={resolveMethodIcon(form.icon)} alt="" />
                ) : (
                  <RiImageAddLine />
                )}
                <div>
                  <strong>{uploadingLogo ? "Uploading..." : "Choose logo image"}</strong>
                  <small>JPG, PNG, GIF, or WebP. Converted to optimized WebP.</small>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            </div>

            <label className="payment-method-switch">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
              <span>Active on topup page</span>
            </label>

            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving}>
              {editingId ? <RiSave3Line /> : <RiAddLine />}
              {saving ? "Saving..." : editingId ? "Update Method" : "Add Method"}
            </button>
          </div>
        </form>

        <div className="pa-panel payment-method-list-panel">
          <div className="wallet-panel-head">
            <div>
              <h2>Available Methods</h2>
            </div>
          </div>

          {loading ? (
            <div className="pa-empty-state">Loading payment methods...</div>
          ) : methods.length === 0 ? (
            <div className="pa-empty-state">
              <RiBankCardLine />
              <h3>No payment method found</h3>
            </div>
          ) : (
            <div className="payment-method-list">
              {methods.map((method) => {
                const icon = resolveMethodIcon(method.icon);
                return (
                  <article className={`payment-method-row ${icon ? "has-icon" : ""}`} key={method.id}>
                    {icon && <img src={icon} alt="" />}
                    <div>
                      <strong>{method.name}</strong>
                      <span>{method.account_number || method.type || "No account number"}</span>
                    </div>
                    <span className={`pa-status ${method.is_active ? "is-completed" : "is-danger"}`}>
                      {method.is_active ? "Active" : "Inactive"}
                    </span>
                    <div className="pa-row-actions wallet-row-actions">
                      <button className="pa-icon-btn" type="button" onClick={() => handleEdit(method)} title="Edit">
                        <RiEdit2Line />
                      </button>
                      <button
                        className={`pa-icon-btn ${method.is_active ? "is-cancelled" : "is-confirm"}`}
                        type="button"
                        onClick={() => handleToggle(method)}
                        title={method.is_active ? "Deactivate method" : "Activate method"}
                      >
                        {method.is_active ? <RiCloseCircleLine /> : <RiCheckboxCircleLine />}
                      </button>
                      <button className="pa-icon-btn is-cancelled" type="button" onClick={() => handleDelete(method)} title="Delete">
                        <RiDeleteBinLine />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
