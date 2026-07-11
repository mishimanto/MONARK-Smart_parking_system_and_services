import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiImageLine,
  RiSaveLine,
  RiTeamLine,
  RiUploadCloud2Line,
} from "react-icons/ri";
import {
  createTeamMember,
  getAdminTeamMember,
  updateTeamMember,
  uploadTeamMemberImage,
} from "../../api/client";
import { resolveAssetUrl } from "../../utils/assets";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import "./css/ParkingAdmin.css";
import "./css/SiteSettingsAdmin.css";
import "./css/TeamAdmin.css";

const emptyForm = {
  name: "",
  position: "",
  bio: "",
  image: "",
  is_founder: false,
  sort_order: 0,
  is_active: true,
  linkedin_url: "",
  twitter_url: "",
  github_url: "",
};

export default function TeamMemberForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchMember = useCallback(async () => {
    if (!isEdit) return;

    setLoading(true);
    try {
      const response = await getAdminTeamMember(id);
      setFormData({
        ...emptyForm,
        ...(response.data || {}),
        is_founder: Boolean(response.data?.is_founder),
        is_active: Boolean(response.data?.is_active),
        sort_order: response.data?.sort_order || 0,
      });
    } catch (error) {
      showErrorToast("Failed to load member", error.response?.data?.message || "Please try again.");
      navigate("/admin/team-members");
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, navigate]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const updateField = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: null }));
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showErrorToast("Invalid image", "Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showErrorToast("File too large", "Team image must be less than 2MB.");
      return;
    }

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);
      const response = await uploadTeamMemberImage(uploadData);
      updateField("image", response.url);
      showSuccessToast("Image uploaded", "Save the member to publish it.");
    } catch (error) {
      showErrorToast("Upload failed", error.response?.data?.message || "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      ...formData,
      sort_order: Number(formData.sort_order || 0),
      is_founder: Boolean(formData.is_founder),
      is_active: Boolean(formData.is_active),
    };

    try {
      if (isEdit) {
        await updateTeamMember(id, payload);
        showSuccessToast("Team member updated", "About page data refreshed.");
      } else {
        await createTeamMember(payload);
        showSuccessToast("Team member added", "About page data refreshed.");
      }
      navigate("/admin/team-members");
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      showErrorToast("Save failed", error.response?.data?.message || "Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="parking-admin-page team-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>{isEdit ? "Edit Team Member" : "Add Team Member"}</h1>
        </div>
        <Link className="pa-btn pa-btn-ghost" to="/admin/team-members">
          <RiArrowLeftLine /> Back to Team
        </Link>
      </div>

      {loading ? (
        <div className="pa-panel">
          <div className="pa-empty-state">Loading team member...</div>
        </div>
      ) : (
        <form className="pa-form-panel team-form-panel team-form-page" onSubmit={handleSubmit}>
          <div className="settings-section-head">
            <div>
              <span className="parking-admin-kicker">{isEdit ? "Update" : "Create"}</span>
              <h2>{isEdit ? "Update Member Information" : "Create New Member"}</h2>
            </div>
            <RiTeamLine />
          </div>

          <div className="settings-media-card team-image-card">
            <div className="settings-media-preview">
              {formData.image ? (
                <img src={resolveAssetUrl(formData.image)} alt="Team preview" />
              ) : (
                <RiImageLine />
              )}
            </div>
            <div className="settings-media-body">
              <span>Profile Image</span>
              <p>Images are saved in backend-api/storage/app/public/team/</p>
              <input value={formData.image || ""} onChange={(event) => updateField("image", event.target.value)} placeholder="Image URL" />
              <label className="settings-upload-btn">
                <RiUploadCloud2Line />
                {uploading ? "Uploading..." : "Upload Image"}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {errors.image && <small className="settings-field-error">{errors.image[0]}</small>}
            </div>
          </div>

          <div className="pa-form-grid team-form-grid">
            <label className="pa-field">
              <span>Name</span>
              <input value={formData.name} onChange={(event) => updateField("name", event.target.value)} required />
              {errors.name && <small className="settings-field-error">{errors.name[0]}</small>}
            </label>
            <label className="pa-field">
              <span>Position</span>
              <input value={formData.position} onChange={(event) => updateField("position", event.target.value)} required />
              {errors.position && <small className="settings-field-error">{errors.position[0]}</small>}
            </label>
            <label className="pa-field">
              <span>Sort Order</span>
              <input type="number" min="0" value={formData.sort_order} onChange={(event) => updateField("sort_order", event.target.value)} />
            </label>
            <label className="pa-field">
              <span>Status</span>
              <select value={formData.is_active ? "1" : "0"} onChange={(event) => updateField("is_active", event.target.value === "1")}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </label>
            <label className="pa-field pa-field-wide">
              <span>Bio</span>
              <textarea rows="4" value={formData.bio || ""} onChange={(event) => updateField("bio", event.target.value)} />
              {errors.bio && <small className="settings-field-error">{errors.bio[0]}</small>}
            </label>
            <label className="team-check-field pa-field-wide">
              <input type="checkbox" checked={Boolean(formData.is_founder)} onChange={(event) => updateField("is_founder", event.target.checked)} />
              <span>Show this person as Founder & CEO</span>
            </label>
            <label className="pa-field">
              <span>LinkedIn URL</span>
              <input value={formData.linkedin_url || ""} onChange={(event) => updateField("linkedin_url", event.target.value)} />
            </label>
            <label className="pa-field">
              <span>Twitter/X URL</span>
              <input value={formData.twitter_url || ""} onChange={(event) => updateField("twitter_url", event.target.value)} />
            </label>
            <label className="pa-field pa-field-wide">
              <span>GitHub URL</span>
              <input value={formData.github_url || ""} onChange={(event) => updateField("github_url", event.target.value)} />
            </label>
          </div>

          <div className="pa-form-footer">
            <button className="pa-btn pa-btn-primary" type="submit" disabled={saving}>
              <RiSaveLine /> {saving ? "Saving..." : isEdit ? "Update Member" : "Add Member"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
