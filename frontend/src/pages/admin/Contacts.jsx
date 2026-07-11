import { useCallback, useEffect, useState } from "react";
import {
  RiContactsBookLine,
  RiEditLine,
  RiMailLine,
  RiMapPinLine,
  RiPhoneLine,
  RiRefreshLine,
  RiSaveLine,
  RiTimeLine,
} from "react-icons/ri";
import { FiEdit } from "react-icons/fi"
import { API_BASE_URL } from "../../api/client";
import { showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/CommunicationsAdmin.css";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    address: "",
    phone: "",
    email: "",
    map_embed: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const getAuthToken = useCallback(() => localStorage.getItem("token") || sessionStorage.getItem("token"), []);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = getAuthToken();
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: "GET",
        headers,
      });

      if (response.status === 401) throw new Error("Authentication required. Please login again.");
      if (response.status === 403) throw new Error("You don't have permission to access contacts.");
      if (response.status === 404) throw new Error("Contacts API endpoint not found. Check backend routes.");
      if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);

      const data = await response.json();
      if (data && data.error) throw new Error(data.message || data.error);

      const rows = Array.isArray(data) ? data : [];
      setContacts(rows);
      if (rows.length > 0) {
        setFormData({
          address: rows[0].address || "",
          phone: rows[0].phone || "",
          email: rows[0].email || "",
          map_embed: rows[0].map_embed || "",
        });
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Fetch contacts error:", err);
      if (err.message.includes("Failed to fetch")) {
        setError("Cannot connect to server. Please check if backend is running.");
      } else if (err.message.includes("CORS")) {
        setError("CORS error. Please check backend CORS configuration.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = getAuthToken();
      const currentContactId = contacts.length > 0 ? contacts[0].id : null;
      const url = isEditing && currentContactId
        ? `${API_BASE_URL}/contacts/${currentContactId}`
        : `${API_BASE_URL}/contacts`;
      const method = isEditing && currentContactId ? "PUT" : "POST";
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (response.status === 401) throw new Error("Authentication required. Please login again.");
      if (response.status === 422) {
        const errorData = await response.json();
        const validationErrors = Object.values(errorData.errors || errorData.messages || {}).flat();
        throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
      }
      if (response.status === 404) throw new Error("Contact not found. It may have been deleted.");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      await response.json();
      await fetchContacts();
      showSuccessToast(isEditing ? "Contact updated" : "Contact saved");
    } catch (err) {
      console.error("Save contact error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      address: contacts[0]?.address || "",
      phone: contacts[0]?.phone || "",
      email: contacts[0]?.email || "",
      map_embed: contacts[0]?.map_embed || "",
    });
  };

  const MapPreview = () => {
    if (!formData.map_embed || !formData.map_embed.includes("iframe")) {
      return (
        <div className="pa-empty-state comm-map-empty">
          <RiMapPinLine />
          <h3>No map preview</h3>
          <p>Add a Google Maps iframe code to preview the location.</p>
        </div>
      );
    }

    const sanitizedMapEmbed = formData.map_embed
      .replace(/on\w+=/g, "data-removed=")
      .replace(/javascript:/g, "data-removed:");

    return <div className="comm-map-preview" dangerouslySetInnerHTML={{ __html: sanitizedMapEmbed }} />;
  };

  return (
    <section className="parking-admin-page service-admin-page communications-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Contact Information</h1>
        </div>
        <button className="pa-btn pa-btn-ghost" type="button" onClick={fetchContacts} disabled={loading}>
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

      <div className="comm-contact-layout">
        <form className="pa-form-panel" onSubmit={handleSubmit}>
          <div className="comm-panel-head is-form">
            <div>
              <h2>{isEditing ? "Update Contact Information" : "Add Contact Information"}</h2>
            </div>
            <FiEdit />
          </div>

          <div className="pa-form-grid">
            <label className="pa-field pa-field-wide">
              <span>Address</span>
              <textarea
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Enter complete address"
                disabled={saving}
              />
            </label>

            <label className="pa-field">
              <span>Phone Number</span>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+880 XXXX-XXXXXX"
                disabled={saving}
              />
            </label>

            <label className="pa-field">
              <span>Email Address</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="contact@example.com"
                disabled={saving}
              />
            </label>

            <label className="pa-field pa-field-wide">
              <span>Google Map Embed Code</span>
              <textarea
                name="map_embed"
                rows="4"
                value={formData.map_embed}
                onChange={handleInputChange}
                placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450"></iframe>'
                disabled={saving}
              />
            </label>
          </div>

          <div className="pa-form-footer">
            <button className="pa-btn pa-btn-ghost" type="button" onClick={resetForm} disabled={saving}>
              Reset
            </button>
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving}>
              <RiSaveLine /> {saving ? (isEditing ? "Updating..." : "Saving...") : `${isEditing ? "Update" : "Save"} Contact`}
            </button>
          </div>
        </form>

        <div className="comm-contact-side">
          <div className="pa-panel">
            <div className="comm-panel-head">
              <div>
                <h2>Map Preview</h2>
              </div>
              <RiMapPinLine />
            </div>
            <MapPreview />
          </div>

          <div className="pa-panel">
            <div className="comm-panel-head">
              <div>
                <h2>Current Contact</h2>
              </div>
            </div>
            {contacts.length > 0 ? (
              <div className="comm-contact-list">
                <p><RiMapPinLine /> <span>{contacts[0].address}</span></p>
                <p><RiPhoneLine /> <span>{contacts[0].phone}</span></p>
                <p><RiMailLine /> <span>{contacts[0].email}</span></p>
                <p><RiTimeLine /> <span>{new Date(contacts[0].updated_at).toLocaleString("en-BD")}</span></p>
              </div>
            ) : (
              <div className="pa-empty-state">
                <RiContactsBookLine />
                <h3>No contact information</h3>
                <p>Add your company contact details using the form.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
