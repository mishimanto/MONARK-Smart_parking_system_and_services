import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RiArrowLeftLine, RiParkingBoxLine, RiSave3Line } from "react-icons/ri";
import { API_BASE_URL, getStoredToken } from "../../api/client";
import { showAdminError, showAdminSuccess } from "./utils/adminAlerts";
import "./css/ParkingAdmin.css";

const emptyForm = {
  parking_id: "",
  slot_code: "",
  type: "Standard",
  available: true,
};

export default function AdminSlotForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getStoredToken()}`,
      Accept: "application/json",
    }),
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        axios.get(`${API_BASE_URL}/admin/parkings`, { headers: authHeaders, params: { per_page: 1000 } }),
      ];
      if (isEdit) requests.push(axios.get(`${API_BASE_URL}/admin/slots`, { headers: authHeaders, params: { per_page: 1000 } }));

      const [parkingsRes, slotsRes] = await Promise.all(requests);
      setParkings(parkingsRes.data.success ? parkingsRes.data.data?.data || [] : []);

      if (isEdit) {
        const slot = slotsRes.data.success
          ? (slotsRes.data.data?.data || []).find((item) => String(item.id) === String(id))
          : null;

        if (!slot) {
          showAdminError("Slot not found");
          navigate("/admin/slots");
          return;
        }

        setFormData({
          parking_id: slot.parking_id || "",
          slot_code: slot.slot_code || "",
          type: slot.type || "Standard",
          available: Boolean(slot.available),
        });
      }
    } catch (err) {
      console.error("Error loading slot form:", err.response?.data || err.message);
      showAdminError("Failed to load slot form", err.response?.data?.message || "Please try again.");
      navigate("/admin/slots");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, id, isEdit, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `${API_BASE_URL}/admin/slots/${id}` : `${API_BASE_URL}/admin/slots`;
      const method = isEdit ? axios.put : axios.post;
      const res = await method(url, formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        showAdminSuccess(
          isEdit ? "Slot updated" : "Slot created",
          `${formData.slot_code || "Parking slot"} saved successfully.`
        );
        navigate("/admin/slots");
      }
    } catch (err) {
      console.error("Error saving slot:", err.response?.data || err.message);
      showAdminError("Failed to save parking slot", err.response?.data?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="parking-admin-page"><div className="pa-empty-state">Loading slot form...</div></div>;
  }

  return (
    <section className="parking-admin-page">
      <div className="parking-admin-hero">
        <div>          
          <h1>{isEdit ? "Edit Slot" : "Add Slot"}</h1>
        </div>
        <Link className="pa-link-action" to="/admin/slots">
          <RiArrowLeftLine /> Back to slots
        </Link>
      </div>

      <form className="pa-form-layout is-compact" onSubmit={handleSubmit}>
        <aside className="pa-form-preview">
          <div className="pa-slot-preview">
            <RiParkingBoxLine />
            <strong>{formData.slot_code || "Slot Code"}</strong>
            <span>{formData.type}</span>
          </div>
          <p className="pa-help-text">Use short readable codes like A1, B12, VIP-03 so staff can identify slots quickly.</p>
        </aside>

        <div className="pa-form-panel">
          <div className="pa-form-grid">
            <label className="pa-field pa-field-wide">
              <span>Parking Lot</span>
              <select
                value={formData.parking_id}
                onChange={(event) => updateField("parking_id", event.target.value)}
                required
              >
                <option value="">Choose parking lot</option>
                {parkings.map((parking) => (
                  <option key={parking.id} value={parking.id}>
                    {parking.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="pa-field">
              <span>Slot Code</span>
              <input
                value={formData.slot_code}
                onChange={(event) => updateField("slot_code", event.target.value)}
                placeholder="A1"
                required
              />
            </label>
            <label className="pa-field">
              <span>Slot Type</span>
              <select value={formData.type} onChange={(event) => updateField("type", event.target.value)} required>
                <option value="Standard">Standard</option>
                <option value="Large">Large</option>
              </select>
            </label>
            <label className="pa-toggle-field pa-field-wide">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(event) => updateField("available", event.target.checked)}
              />
              <span>
                <strong>Available for booking</strong>              
              </span>
            </label>
          </div>

          <div className="pa-form-footer">
            <Link className="pa-btn pa-btn-ghost" to="/admin/slots">Cancel</Link>
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving}>
              <RiSave3Line /> {saving ? "Saving..." : isEdit ? "Update Slot" : "Create Slot"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
