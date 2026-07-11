import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiImageAddLine,
  RiParkingBoxLine,
  RiSave3Line,
} from "react-icons/ri";
import { API_BASE_URL, APP_BASE_URL, getStoredToken } from "../../api/client";
import { showAdminError, showAdminSuccess } from "./utils/adminAlerts";
import "./css/ParkingAdmin.css";

const emptyForm = {
  name: "",
  description: "",
  address: "",
  price_per_hour: "",
  distance: "",
  latitude: "",
  longitude: "",
  total_slots: "",
  image: "",
};

const getImageUrl = (image) => {
  if (!image || image === "null" || image === "undefined") return "";
  const imageValue = String(image).trim();
  if (/^https?:\/\//i.test(imageValue) || imageValue.startsWith("data:")) return imageValue;
  if (imageValue.startsWith("/images/")) return imageValue;
  if (imageValue.startsWith("/storage/")) return `${APP_BASE_URL}${imageValue}`;
  if (imageValue.startsWith("storage/")) return `${APP_BASE_URL}/${imageValue}`;
  const cleanPath = imageValue.replace(/^\/+/, "");
  return `${APP_BASE_URL}/storage/${cleanPath}`;
};

export default function AdminParkingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${getStoredToken()}`,
      Accept: "application/json",
    }),
    []
  );

  const fetchParking = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/parkings`, {
        headers: authHeaders,
        params: { per_page: 1000 },
      });
      const parkingList = res.data.success ? res.data.data?.data || [] : [];
      const parking = parkingList
        ? parkingList.find((item) => String(item.id) === String(id))
        : null;

      if (!parking) {
        showAdminError("Parking lot not found");
        navigate("/admin/parkings");
        return;
      }

      setFormData({
        name: parking.name || "",
        description: parking.description || "",
        address: parking.address || "",
        price_per_hour: parking.price_per_hour || "",
        distance: parking.distance || "",
        latitude: parking.latitude || "",
        longitude: parking.longitude || "",
        total_slots: parking.total_slots || "",
        image: parking.image || "",
      });
      setImagePreview(getImageUrl(parking.image));
    } catch (err) {
      console.error("Error loading parking:", err.response?.data || err.message);
      showAdminError("Failed to load parking lot", err.response?.data?.message || "Please try again.");
      navigate("/admin/parkings");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, id, isEdit, navigate]);

  useEffect(() => {
    fetchParking();
  }, [fetchParking]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const findCoordinates = async () => {
    const query = formData.address || formData.name;
    if (!query) {
      showAdminError("Add an address first", "Enter the parking address or name to find coordinates.");
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

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAdminError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAdminError("Image size should be less than 5MB");
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);
      const res = await axios.post(`${API_BASE_URL}/admin/upload-image`, uploadFormData, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        updateField("image", res.data.url);
        setImagePreview(getImageUrl(res.data.url));
      }
    } catch (err) {
      console.error("Error uploading image:", err.response?.data || err.message);
      showAdminError("Failed to upload image", err.response?.data?.message || "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const url = isEdit
        ? `${API_BASE_URL}/admin/parkings/${id}`
        : `${API_BASE_URL}/admin/parkings`;
      const method = isEdit ? axios.put : axios.post;
      const res = await method(url, formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        showAdminSuccess(
          isEdit ? "Parking lot updated" : "Parking lot created",
          `${formData.name || "Parking lot"} saved successfully.`
        );
        navigate("/admin/parkings");
      }
    } catch (err) {
      console.error("Error saving parking:", err.response?.data || err.message);
      showAdminError("Failed to save parking lot", err.response?.data?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="parking-admin-page"><div className="pa-empty-state">Loading parking form...</div></div>;
  }

  return (
    <section className="parking-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>{isEdit ? "Edit Parking Lot" : "Add Parking Lot"}</h1>
        </div>
        <Link className="pa-link-action" to="/admin/parkings">
          <RiArrowLeftLine /> Back to parking lots
        </Link>
      </div>

      <form className="pa-form-layout" onSubmit={handleSubmit}>
        <aside className="pa-form-preview">
          <div className="pa-upload-box">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Parking preview"
                onError={(event) => {
                  event.currentTarget.src = "/images/default-parking.jpg";
                }}
              />
            ) : (
              <div className="pa-upload-empty">
                <RiParkingBoxLine />
                <span>No image selected</span>
              </div>
            )}
          </div>
          <label className="pa-btn pa-btn-ghost pa-file-btn">
            <RiImageAddLine /> {uploading ? "Uploading..." : "Choose Image"}
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
          </label>
          <p className="pa-help-text">Use a clear parking lot photo. JPG, PNG or GIF, maximum 5MB.</p>
        </aside>

        <div className="pa-form-panel">
          <div className="pa-form-grid">
            <label className="pa-field">
              <span>Parking Name</span>
              <input value={formData.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>
            <label className="pa-field">
              <span>Address</span>
              <input
                value={formData.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Chasara, Narayanganj, Dhaka"
              />
            </label>
            <label className="pa-field">
              <span>Fallback Distance</span>
              <input
                value={formData.distance}
                onChange={(event) => updateField("distance", event.target.value)}
                placeholder="Example: 2 km"
              />
              <small className="pa-help-text">
                Used only when coordinates are missing or the user blocks location permission.
              </small>
            </label>
            <label className="pa-field">
              <span>Price Per Hour (BDT)</span>
              <input
                type="number"
                min="0"
                value={formData.price_per_hour}
                onChange={(event) => updateField("price_per_hour", event.target.value)}
                required
              />
            </label>
            <label className="pa-field">
              <span>Total Slots</span>
              <input
                type="number"
                min="0"
                value={formData.total_slots}
                onChange={(event) => updateField("total_slots", event.target.value)}
                required
              />
            </label>
            <div className="pa-field">
              <span>Coordinates</span>
              <div className="pa-inline-fields">
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(event) => updateField("latitude", event.target.value)}
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(event) => updateField("longitude", event.target.value)}
                  placeholder="Longitude"
                />
              </div>
              <button className="pa-btn pa-btn-ghost" type="button" onClick={findCoordinates}>
                Find Coordinates
              </button>
            </div>
            <label className="pa-field pa-field-wide">
              <span>Description</span>
              <textarea
                rows="5"
                value={formData.description}
                onChange={(event) => updateField("description", event.target.value)}
                required
              />
            </label>
          </div>

          <div className="pa-form-footer">
            <Link className="pa-btn pa-btn-ghost" to="/admin/parkings">Cancel</Link>
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving || uploading}>
              <RiSave3Line /> {saving ? "Saving..." : isEdit ? "Update Parking" : "Create Parking"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
