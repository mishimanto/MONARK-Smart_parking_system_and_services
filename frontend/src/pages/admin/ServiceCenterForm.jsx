import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RiArrowLeftLine, RiSave3Line, RiServiceLine } from "react-icons/ri";
import { API_BASE_URL, getStoredToken } from "../../api/client";
import { showAdminError, showAdminSuccess } from "./utils/adminAlerts";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";

const emptyForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  latitude: "",
  longitude: "",
  opening_hours: "",
  is_active: true,
};

export default function ServiceCenterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCenter = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/service-centers/${id}`, {
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
          Accept: "application/json",
        },
      });

      const center = response.data?.data || response.data;
      setFormData({
        name: center.name || "",
        address: center.address || "",
        phone: center.phone || "",
        email: center.email || "",
        latitude: center.latitude?.toString() || "",
        longitude: center.longitude?.toString() || "",
        opening_hours: center.opening_hours || "",
        is_active: center.is_active !== undefined ? Boolean(center.is_active) : true,
      });
    } catch (err) {
      console.error("Error loading service center:", err.response?.data || err.message);
      showAdminError("Failed to load service center", err.response?.data?.message || "Please try again.");
      setError("Failed to load service center.");
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    fetchCenter();
  }, [fetchCenter]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const findCoordinates = async () => {
    const query = formData.address || formData.name;
    if (!query) {
      showAdminError("Add an address first", "Enter the service center address or name to find coordinates.");
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
      );
      const results = await response.json();

      if (!results.length) {
        showAdminError("Location not found", "Try a more complete address.");
        return;
      }

      setFormData((current) => ({
        ...current,
        latitude: results[0].lat,
        longitude: results[0].lon,
      }));
      showAdminSuccess("Coordinates found", "Latitude and longitude added.");
    } catch (err) {
      console.error("Error finding coordinates:", err);
      showAdminError("Failed to find coordinates", "Please enter latitude and longitude manually.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const requestData = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      email: formData.email || "",
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      opening_hours: formData.opening_hours || "",
      is_active: formData.is_active ? 1 : 0,
    };

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };

      if (isEdit) {
        await axios.put(`${API_BASE_URL}/admin/service-centers/${id}`, requestData, config);
      } else {
        await axios.post(`${API_BASE_URL}/admin/service-centers`, requestData, config);
      }

      showAdminSuccess(
        isEdit ? "Service center updated" : "Service center created",
        `${formData.name} saved successfully.`
      );
      navigate("/admin/service-centers");
    } catch (err) {
      console.error("Error saving service center:", err.response?.data || err.message);
      const errorMessage = err.response?.status === 422 && err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(", ")
        : err.response?.data?.message || "Failed to save service center.";
      showAdminError("Failed to save service center", errorMessage || "Please try again.");
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const messages = Object.values(err.response.data.errors).flat().join(", ");
        setError(messages || "Validation failed.");
      } else {
        setError(err.response?.data?.message || "Failed to save service center.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="parking-admin-page"><div className="pa-empty-state">Loading service center form...</div></section>;
  }

  return (
    <section className="parking-admin-page service-admin-page service-centers-page">
      <div className="parking-admin-hero">
        <div>
          <h1>{isEdit ? "Edit Service Center" : "Add Service Center"}</h1>
        </div>
        <Link className="pa-link-action" to="/admin/service-centers">
          <RiArrowLeftLine /> Back to centers
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form className="pa-form-layout is-compact service-center-form-layout" onSubmit={handleSubmit}>
        <aside className="pa-form-preview">
          <div className="pa-slot-preview">
            <RiServiceLine />
            <strong>{formData.name || "Center Name"}</strong>
            <span>{formData.is_active ? "Active" : "Inactive"}</span>
          </div>
          <p className="pa-help-text">Coordinates are used for map and nearest service center flows.</p>
        </aside>

        <div className="pa-form-panel">
          <div className="pa-form-grid">
            <label className="pa-field">
              <span>Name</span>
              <input value={formData.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>
            <label className="pa-field">
              <span>Phone</span>
              <input value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} required />
            </label>
            <label className="pa-field pa-field-wide">
              <span>Address</span>
              <textarea rows="3" value={formData.address} onChange={(event) => updateField("address", event.target.value)} required />
            </label>
            <label className="pa-field">
              <span>Email</span>
              <input type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} />
            </label>
            <label className="pa-field">
              <span>Opening Hours</span>
              <input value={formData.opening_hours} onChange={(event) => updateField("opening_hours", event.target.value)} placeholder="8:00 AM - 10:00 PM" />
            </label>
            <div className="pa-field pa-field-wide">
              <span>Coordinates</span>
              <div className="pa-inline-fields">
                <input type="number" step="any" value={formData.latitude} onChange={(event) => updateField("latitude", event.target.value)} placeholder="Latitude" required />
                <input type="number" step="any" value={formData.longitude} onChange={(event) => updateField("longitude", event.target.value)} placeholder="Longitude" required />
              </div>
              <button className="pa-btn pa-btn-ghost" type="button" onClick={findCoordinates}>
                Find Coordinates
              </button>
            </div>
            <label className="pa-toggle-field pa-field-wide">
              <input type="checkbox" checked={formData.is_active} onChange={(event) => updateField("is_active", event.target.checked)} />
              <span>
                <strong>Active service center</strong>
              </span>
            </label>
          </div>

          <div className="pa-form-footer">
            <Link className="pa-btn pa-btn-ghost" to="/admin/service-centers">Cancel</Link>
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving}>
              <RiSave3Line /> {saving ? "Saving..." : isEdit ? "Update Center" : "Create Center"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
