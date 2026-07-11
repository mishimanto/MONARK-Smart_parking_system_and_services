import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  RiBuilding4Line,
  RiFacebookCircleLine,
  RiGlobalLine,
  RiImageLine,
  RiInstagramLine,
  RiLinkedinBoxLine,
  RiMailLine,
  RiMapPin2Line,
  RiPhoneLine,
  RiSaveLine,
  RiSettings3Line,
  RiTimeLine,
  RiTwitterXLine,
  RiUploadCloud2Line,
  RiYoutubeLine,
} from "react-icons/ri";
import { getAdminSiteSettings, updateAdminSiteSettings, uploadSiteSettingMedia } from "../../api/client";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { resolveAssetUrl } from "../../utils/assets";
import "./css/ParkingAdmin.css";
import "./css/SiteSettingsAdmin.css";

const emptyForm = {
  site_name: "",
  tagline: "",
  description: "",
  logo: "",
  favicon: "",
  primary_phone: "",
  secondary_phone: "",
  support_email: "",
  business_email: "",
  address: "",
  business_hours: "",
  facebook_url: "",
  twitter_url: "",
  linkedin_url: "",
  instagram_url: "",
  youtube_url: "",
  footer_description: "",
  copyright_text: "",
  footer_features: ["", "", "", ""],
};

const normalizeFeatures = (features) => {
  const rows = Array.isArray(features) ? features : [];
  return [...rows, "", "", "", ""].slice(0, 6);
};

export default function SiteSettings() {
  const { refreshSettings } = useSiteSettings();
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [errors, setErrors] = useState({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAdminSiteSettings();
      const settings = response.data || {};
      setFormData({
        ...emptyForm,
        ...settings,
        footer_features: normalizeFeatures(settings.footer_features),
      });
    } catch (error) {
      showErrorToast("Failed to load settings", error.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: null }));
    }
  };

  const updateFeature = (index, value) => {
    setFormData((previous) => {
      const nextFeatures = [...previous.footer_features];
      nextFeatures[index] = value;
      return { ...previous, footer_features: nextFeatures };
    });
  };

  const requestAdminPassword = async (title = "Verify admin password") => {
    const result = await Swal.fire({
      title,
      text: "Enter your admin password to continue.",
      input: "password",
      inputPlaceholder: "Admin password",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        autocomplete: "current-password",
      },
      showCancelButton: true,
      confirmButtonText: "Verify",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#00b8c4",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage("Admin password is required");
          return false;
        }

        return value;
      },
    });

    return result.isConfirmed ? result.value : null;
  };

  const handleMediaUpload = async (field, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".ico")) {
      showErrorToast("Invalid file", "Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showErrorToast("File too large", "Logo and favicon files must be less than 2MB.");
      return;
    }

    const password = await requestAdminPassword(`Verify ${field === "logo" ? "logo upload" : "favicon upload"}`);
    if (!password) return;

    setUploadingField(field);

    try {
      const uploadData = new FormData();
      uploadData.append("image", file);
      uploadData.append("type", field);
      uploadData.append("admin_password", password);

      const response = await uploadSiteSettingMedia(uploadData);
      if (response.success) {
        updateField(field, response.url);
        showSuccessToast(`${field === "logo" ? "Logo" : "Favicon"} uploaded`, "Now save settings to publish it.");
      }
    } catch (error) {
      showErrorToast("Upload failed", error.response?.data?.message || "Please try again.");
    } finally {
      setUploadingField("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const password = await requestAdminPassword("Verify site settings update");
    if (!password) return;

    setSaving(true);
    setErrors({});

    const payload = {
      ...formData,
      footer_features: formData.footer_features.map((item) => item.trim()).filter(Boolean),
      admin_password: password,
    };

    try {
      const response = await updateAdminSiteSettings(payload);
      setFormData({
        ...emptyForm,
        ...response.data,
        footer_features: normalizeFeatures(response.data?.footer_features),
      });
      await refreshSettings();
      showSuccessToast("Settings saved", "Header and footer data updated globally.");
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      showErrorToast("Failed to save settings", error.response?.data?.message || "Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="parking-admin-page site-settings-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Site Settings</h1>
        </div>        
      </div>

      {loading ? (
        <div className="pa-panel">
          <div className="pa-empty-state">
            <RiSettings3Line />
            <h3>Loading settings...</h3>
          </div>
        </div>
      ) : (
        <form className="site-settings-layout" onSubmit={handleSubmit}>
          <div className="site-settings-main">
            <section className="pa-form-panel settings-section">
              <div className="settings-section-head">
                <div>
                  <h2>Identity</h2>
                </div>
                <RiBuilding4Line />
              </div>

              <div className="pa-form-grid">
                <label className="pa-field">
                  <span>Site Name</span>
                  <input value={formData.site_name} onChange={(event) => updateField("site_name", event.target.value)} required />
                  {errors.site_name && <small className="settings-field-error">{errors.site_name[0]}</small>}
                </label>
                <label className="pa-field">
                  <span>Tagline</span>
                  <input value={formData.tagline || ""} onChange={(event) => updateField("tagline", event.target.value)} />
                </label>
                <label className="pa-field pa-field-wide">
                  <span>Short Description</span>
                  <textarea rows="3" value={formData.description || ""} onChange={(event) => updateField("description", event.target.value)} />
                </label>
                <div className="settings-media-grid pa-field-wide">
                  {[
                    ["logo", "Logo", "Recommended wide transparent PNG"],
                    ["favicon", "Favicon", "Recommended square PNG or ICO"],
                  ].map(([field, title, note]) => (
                    <div className="settings-media-card" key={field}>
                      <div className="settings-media-preview">
                        {formData[field] ? (
                          <img src={resolveAssetUrl(formData[field])} alt={`${title} preview`} />
                        ) : (
                          <RiImageLine />
                        )}
                      </div>
                      <div className="settings-media-body">
                        <span>{title}</span>
                        <p>{note}</p>
                        <input value={formData[field] || ""} onChange={(event) => updateField(field, event.target.value)} placeholder={`${title} URL`} />
                        <label className="settings-upload-btn">
                          <RiUploadCloud2Line />
                          {uploadingField === field ? "Uploading..." : `Upload ${title}`}
                          <input
                            type="file"
                            accept={field === "favicon" ? "image/*,.ico" : "image/*"}
                            onChange={(event) => handleMediaUpload(field, event)}
                            disabled={Boolean(uploadingField)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="pa-form-panel settings-section">
              <div className="settings-section-head">
                <div>
                  <h2>Contact Details</h2>
                </div>
                <RiPhoneLine />
              </div>

              <div className="pa-form-grid">
                <label className="pa-field">
                  <span>Primary Phone</span>
                  <input value={formData.primary_phone || ""} onChange={(event) => updateField("primary_phone", event.target.value)} />
                </label>
                <label className="pa-field">
                  <span>Secondary Phone</span>
                  <input value={formData.secondary_phone || ""} onChange={(event) => updateField("secondary_phone", event.target.value)} />
                </label>
                <label className="pa-field">
                  <span>Support Email</span>
                  <input type="email" value={formData.support_email || ""} onChange={(event) => updateField("support_email", event.target.value)} />
                  {errors.support_email && <small className="settings-field-error">{errors.support_email[0]}</small>}
                </label>
                <label className="pa-field">
                  <span>Business Email</span>
                  <input type="email" value={formData.business_email || ""} onChange={(event) => updateField("business_email", event.target.value)} />
                  {errors.business_email && <small className="settings-field-error">{errors.business_email[0]}</small>}
                </label>
                <label className="pa-field">
                  <span>Business Hours</span>
                  <input value={formData.business_hours || ""} onChange={(event) => updateField("business_hours", event.target.value)} />
                </label>
                <label className="pa-field pa-field-wide">
                  <span>Address</span>
                  <textarea rows="3" value={formData.address || ""} onChange={(event) => updateField("address", event.target.value)} />
                </label>
              </div>
            </section>

            <section className="pa-form-panel settings-section">
              <div className="settings-section-head">
                <div>
                  <h2>Footer Content</h2>
                </div>
                <RiMailLine />
              </div>

              <div className="pa-form-grid">
                <label className="pa-field pa-field-wide">
                  <span>Footer Description</span>
                  <textarea rows="3" value={formData.footer_description || ""} onChange={(event) => updateField("footer_description", event.target.value)} />
                </label>
                <label className="pa-field pa-field-wide">
                  <span>Copyright Text</span>
                  <input value={formData.copyright_text || ""} onChange={(event) => updateField("copyright_text", event.target.value)} />
                </label>
              </div>

              <div className="settings-feature-grid">
                {formData.footer_features.map((feature, index) => (
                  <label className="pa-field" key={index}>
                    <span>Feature {index + 1}</span>
                    <input value={feature || ""} onChange={(event) => updateFeature(index, event.target.value)} />
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="site-settings-side">
            <section className="pa-form-panel settings-section">
              <div className="settings-section-head">
                <div>
                  <h2>Social Links</h2>
                </div>
                <RiGlobalLine />
              </div>

              <div className="settings-social-list">
                {[
                  ["facebook_url", "Facebook URL", RiFacebookCircleLine],
                  ["twitter_url", "Twitter/X URL", RiTwitterXLine],
                  ["linkedin_url", "LinkedIn URL", RiLinkedinBoxLine],
                  ["instagram_url", "Instagram URL", RiInstagramLine],
                  ["youtube_url", "YouTube URL", RiYoutubeLine],
                ].map(([field, label, Icon]) => (
                  <label className="settings-social-field" key={field}>
                    <Icon />
                    <span>{label}</span>
                    <input value={formData[field] || ""} onChange={(event) => updateField(field, event.target.value)} />
                  </label>
                ))}
              </div>
            </section>

            <section className="settings-preview">
              <div>
                <span className="parking-admin-kicker">Preview</span>
                <h3>{formData.site_name || "MONARK"}</h3>
                <p>{formData.tagline || "Smart parking and premium car care"}</p>
              </div>
              <p><RiMapPin2Line /> {formData.address || "Address not set"}</p>
              <p><RiPhoneLine /> {formData.primary_phone || "Phone not set"}</p>
              <p><RiMailLine /> {formData.support_email || "Email not set"}</p>
              <p><RiTimeLine /> {formData.business_hours || "Hours not set"}</p>
            </section>

            <button className="pa-btn pa-btn-primary settings-save-btn" type="submit" disabled={saving}>
              <RiSaveLine /> {saving ? "Saving..." : "Save Settings"}
            </button>
          </aside>
        </form>
      )}
    </section>
  );
}
