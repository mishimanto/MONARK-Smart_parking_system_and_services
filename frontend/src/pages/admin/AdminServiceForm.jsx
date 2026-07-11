import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RiArrowLeftLine, RiImageAddLine, RiSave3Line, RiServiceLine } from "react-icons/ri";
import {
  APP_BASE_URL,
  createService,
  getAdminServices,
  updateService,
  uploadServiceImage,
} from "../../api/client";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
  status: "active",
  image: "",
};

export default function AdminServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const baseUrl = useMemo(() => `${APP_BASE_URL}/`, []);

  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http") || imagePath.startsWith("data:")) return imagePath;
    if (imagePath.startsWith("/storage/")) return `${baseUrl}${imagePath}`;
    return `${baseUrl}${imagePath}`;
  }, [baseUrl]);

  const fetchService = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const response = await getAdminServices(1, 1000);
      const service = response.success
        ? (response.data?.data || []).find((item) => String(item.id) === String(id))
        : null;

      if (!service) {
        showErrorToast("Service not found");
        navigate("/admin/services");
        return;
      }

      setFormData({
        name: service.name || "",
        description: service.description || "",
        price: service.price || "",
        duration: service.duration || "",
        status: service.status || "active",
        image: service.image || "",
      });
      setImagePreview(getImageUrl(service.image));
    } catch (error) {
      console.error("Error loading service:", error);
      showErrorToast("Failed to load service");
      navigate("/admin/services");
    } finally {
      setLoading(false);
    }
  }, [getImageUrl, id, isEdit, navigate]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showErrorToast("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorToast("Image size should be less than 5MB");
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);
      const result = await uploadServiceImage(uploadFormData);
      if (result.success) {
        updateField("image", result.url);
        setImagePreview(getImageUrl(result.url));
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      showErrorToast("Upload failed", error.message || "Please try again.");
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = isEdit
        ? await updateService(id, formData)
        : await createService(formData);

      if (response.success) {
        showSuccessToast("Success", isEdit ? "Service updated successfully" : "Service created successfully");
        navigate("/admin/services");
      } else {
        throw new Error(response.message || "Failed to save service");
      }
    } catch (error) {
      showErrorToast("Failed to save service", error.response?.data?.message || error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="parking-admin-page"><div className="pa-empty-state">Loading service form...</div></section>;
  }

  return (
    <section className="parking-admin-page service-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>{isEdit ? "Edit Service" : "Add Service"}</h1>
        </div>
        <Link className="pa-link-action" to="/admin/services">
          <RiArrowLeftLine /> Back to services
        </Link>
      </div>

      <form className="pa-form-layout" onSubmit={handleSubmit}>
        <aside className="pa-form-preview">
          <div className="pa-upload-box">
            {imagePreview ? (
              <img src={imagePreview} alt="Service preview" onError={(event) => { event.currentTarget.src = "/images/default-service.jpg"; }} />
            ) : (
              <div className="pa-upload-empty">
                <RiServiceLine />
                <span>No image selected</span>
              </div>
            )}
          </div>
          <label className="pa-btn pa-btn-ghost pa-file-btn">
            <RiImageAddLine /> {uploading ? "Uploading..." : "Choose Image"}
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
          </label>
          <p className="pa-help-text">Use a clear service image. JPG, PNG or GIF, maximum 5MB.</p>
        </aside>

        <div className="pa-form-panel">
          <div className="pa-form-grid">
            <label className="pa-field">
              <span>Service Name</span>
              <input value={formData.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>
            <label className="pa-field">
              <span>Duration</span>
              <input value={formData.duration} onChange={(event) => updateField("duration", event.target.value)} placeholder="30 min" required />
            </label>
            <label className="pa-field">
              <span>Price (BDT)</span>
              <input type="number" min="0" step="0.01" value={formData.price} onChange={(event) => updateField("price", event.target.value)} required />
            </label>
            <label className="pa-field">
              <span>Status</span>
              <select value={formData.status} onChange={(event) => updateField("status", event.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="pa-field pa-field-wide">
              <span>Description</span>
              <textarea rows="5" value={formData.description} onChange={(event) => updateField("description", event.target.value)} required />
            </label>
          </div>

          <div className="pa-form-footer">
            <Link className="pa-btn pa-btn-ghost" to="/admin/services">Cancel</Link>
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving || uploading}>
              <RiSave3Line /> {saving ? "Saving..." : isEdit ? "Update Service" : "Create Service"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
