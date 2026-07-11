// src/pages/admin/Profile.jsx
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  RiLockPasswordLine,
  RiMailLine,
  RiProfileLine,
  RiSaveLine,
  RiShieldCheckLine,
  RiShieldKeyholeLine,
  RiUser3Line,
} from "react-icons/ri";
import { AuthContext } from "../../contexts/AuthContext";
import { changePassword, getProfile, updateProfile } from "../../api/client";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/ProfileAdmin.css";

export default function Profile() {
  const { setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profileData, setProfileData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const fetchProfileData = useCallback(async () => {
    try {
      const response = await getProfile();
      if (response.success) {
        setProfileData(response.user);
        setProfileForm({
          name: response.user.name || "",
          email: response.user.email || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useEffect(() => {
    setValidationErrors({});
    setMessage({ type: "", text: "" });
  }, [activeTab]);

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    setValidationErrors({});

    try {
      const response = await updateProfile(profileForm);
      if (response.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setUser(response.user);
        setProfileData(response.user);
      } else {
        setMessage({ type: "error", text: response.message || "Failed to update profile" });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        setMessage({ type: "error", text: "Please fix the validation errors" });
      } else {
        setMessage({ type: "error", text: error.response?.data?.message || "An error occurred while updating profile" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    setValidationErrors({});

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setValidationErrors({
        new_password_confirmation: ["New password and confirm password do not match"],
      });
      setLoading(false);
      return;
    }

    try {
      const response = await changePassword(passwordForm);
      if (response.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      } else {
        setMessage({ type: "error", text: response.message || "Failed to change password" });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        setMessage({ type: "error", text: error.response?.data?.message || "Please fix the validation errors" });
      } else {
        setMessage({ type: "error", text: error.response?.data?.message || "An error occurred while changing password" });
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (field === "new_password_confirmation" && validationErrors.new_password_confirmation) {
      setValidationErrors((prev) => ({ ...prev, new_password_confirmation: null }));
    }
  };

  const passwordMatch = passwordForm.new_password_confirmation
    ? {
        isValid: passwordForm.new_password === passwordForm.new_password_confirmation,
        message: passwordForm.new_password === passwordForm.new_password_confirmation ? "Passwords match" : "Passwords do not match",
      }
    : null;

  const initial = profileData?.name ? profileData.name.charAt(0).toUpperCase() : "A";

  return (
    <section className="parking-admin-page service-admin-page profile-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>Profile Settings</h1>
        </div>
        <span className="pa-status is-live">
          <RiShieldCheckLine /> {profileData?.role || "Admin"}
        </span>
      </div>

      {message.text && (
        <div className={`profile-alert ${message.type === "success" ? "is-success" : "is-error"}`}>
          <strong>{message.type === "success" ? "Success" : "Error"}</strong>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage({ type: "", text: "" })}>Dismiss</button>
        </div>
      )}

      <div className="profile-tab-grid">
        <button
          className={`profile-tab ${activeTab === "profile" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveTab("profile")}
        >
          <RiUser3Line />
          <span>Profile Information</span>
        </button>
        <button
          className={`profile-tab ${activeTab === "password" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveTab("password")}
        >
          <RiLockPasswordLine />
          <span>Change Password</span>
        </button>
      </div>

      <div className="profile-layout">
        <div className="pa-form-panel">
          {activeTab === "profile" ? (
            <form onSubmit={handleProfileUpdate}>
              <div className="profile-panel-head">
                <div>
                  <h2>Update Profile</h2>
                </div>
                <RiProfileLine />
              </div>

              <div className="pa-form-grid">
                <label className="pa-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                    required
                  />
                  {validationErrors.name && <small className="profile-field-error">{validationErrors.name[0]}</small>}
                </label>

                <label className="pa-field">
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />
                  {validationErrors.email && <small className="profile-field-error">{validationErrors.email[0]}</small>}
                </label>
              </div>

              <div className="pa-form-footer">
                <button className="pa-btn pa-btn-primary" type="submit" disabled={loading}>
                  <RiSaveLine /> {loading ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange}>
              <div className="profile-panel-head">
                <div>
                  <h2>Change Password</h2>
                </div>
                <RiShieldKeyholeLine />
              </div>

              <div className="pa-form-grid">
                <label className="pa-field pa-field-wide">
                  <span>Current Password</span>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(event) => updatePasswordField("current_password", event.target.value)}
                    required
                  />
                  {validationErrors.current_password && <small className="profile-field-error">{validationErrors.current_password[0]}</small>}
                </label>

                <label className="pa-field">
                  <span>New Password</span>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(event) => updatePasswordField("new_password", event.target.value)}
                    required
                    minLength="6"
                  />
                  {validationErrors.new_password && <small className="profile-field-error">{validationErrors.new_password[0]}</small>}
                </label>

                <label className="pa-field">
                  <span>Confirm New Password</span>
                  <input
                    type="password"
                    value={passwordForm.new_password_confirmation}
                    onChange={(event) => updatePasswordField("new_password_confirmation", event.target.value)}
                    required
                  />
                  {validationErrors.new_password_confirmation && <small className="profile-field-error">{validationErrors.new_password_confirmation[0]}</small>}
                  {passwordMatch && !validationErrors.new_password_confirmation && (
                    <small className={passwordMatch.isValid ? "profile-field-success" : "profile-field-error"}>{passwordMatch.message}</small>
                  )}
                </label>
              </div>

              <div className="pa-form-footer">
                <button className="pa-btn pa-btn-primary" type="submit" disabled={loading || (passwordMatch && !passwordMatch.isValid)}>
                  <RiSaveLine /> {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="profile-side-panel">
          <div className="profile-card">
            <div className="profile-avatar">{initial}</div>
            <h3>{profileData?.name || "Admin"}</h3>
            <p><RiMailLine /> {profileData?.email || "admin@example.com"}</p>
            <span className="pa-status is-confirmed">{profileData?.role || "admin"}</span>
          </div>

          <div className="profile-guidance">
            <RiShieldCheckLine />
            <div>
              <span>{activeTab === "profile" ? "Profile Tips" : "Password Rules"}</span>
              {activeTab === "profile" ? (
                <ul>
                  <li>Keep your admin email accurate.</li>
                  <li>Use your real display name for audit clarity.</li>
                </ul>
              ) : (
                <ul>
                  <li>Use at least 6 characters.</li>
                  <li>Use a mix of letters and numbers.</li>
                  <li>Do not reuse old passwords.</li>
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
