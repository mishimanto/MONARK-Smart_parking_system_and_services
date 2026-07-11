import React, { useContext, useEffect, useState } from "react";
import {
  RiCameraLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockPasswordLine,
  RiMailLine,
  RiShieldCheckLine,
  RiUploadCloud2Line,
  RiUser3Line,
  RiWallet3Line,
} from "react-icons/ri";
import { AuthContext } from "../contexts/AuthContext";
import { APP_BASE_URL, changePassword, getProfile, updateProfile, uploadProfileAvatar } from "../api/client";
import "./css/UserProfile.css";

const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatMoney = (amount) => `BDT ${Number.parseFloat(amount || 0).toFixed(2)}`;

const resolveAvatarUrl = (value) => {
  if (!value) return "";
  const avatar = String(value).trim();
  if (!avatar) return "";
  if (/^(https?:|data:)/i.test(avatar)) return avatar;
  return `${APP_BASE_URL}/${avatar.replace(/^\/+/, "")}`;
};

export default function UserProfile() {
  const { setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profileData, setProfileData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current_password: false,
    new_password: false,
    new_password_confirmation: false,
  });
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  useEffect(() => {
    const fetchProfileData = async () => {
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
    };

    fetchProfileData();
  }, []);

  useEffect(() => {
    setValidationErrors({});
    setMessage({ type: "", text: "" });
  }, [activeTab]);

  const syncUserState = (user) => {
    setUser(user);
    setProfileData(user);
    const serializedUser = JSON.stringify(user);
    if (localStorage.getItem("user")) {
      localStorage.setItem("user", serializedUser);
    }
    if (sessionStorage.getItem("user")) {
      sessionStorage.setItem("user", serializedUser);
    }
    if (!localStorage.getItem("user") && !sessionStorage.getItem("user")) {
      localStorage.setItem("user", serializedUser);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await uploadProfileAvatar(file);
      if (response.success) {
        syncUserState(response.user);
        setMessage({ type: "success", text: "Profile picture updated successfully." });
      } else {
        setMessage({ type: "error", text: response.message || "Failed to upload profile picture." });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload profile picture.",
      });
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    setValidationErrors({});

    try {
      const response = await updateProfile(profileForm);
      if (response.success) {
        setMessage({ type: "success", text: "Profile updated successfully." });
        syncUserState(response.user);
      } else {
        setMessage({ type: "error", text: response.message || "Failed to update profile." });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        setMessage({ type: "error", text: "Please fix the validation errors." });
      } else {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "An error occurred while updating profile.",
        });
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
        new_password_confirmation: ["New password and confirm password do not match."],
      });
      setLoading(false);
      return;
    }

    try {
      const response = await changePassword(passwordForm);
      if (response.success) {
        setMessage({ type: "success", text: "Password changed successfully." });
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      } else {
        setMessage({ type: "error", text: response.message || "Failed to change password." });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        setMessage({ type: "error", text: error.response?.data?.message || "Please fix the validation errors." });
      } else {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "An error occurred while changing password.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordInput = (field, value) => {
    setPasswordForm((previous) => ({ ...previous, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((previous) => ({ ...previous, [field]: null }));
    }
  };

  const passwordMatch =
    passwordForm.new_password_confirmation.length > 0
      ? passwordForm.new_password === passwordForm.new_password_confirmation
      : null;

  const togglePassword = (field) => {
    setShowPasswords((previous) => ({ ...previous, [field]: !previous[field] }));
  };

  const initials = profileData?.name ? profileData.name.charAt(0).toUpperCase() : "U";
  const avatarUrl = resolveAvatarUrl(profileData?.avatar_url || profileData?.avatar);

  return (
    <main className="profile-page">
      <div className="profile-shell">       

        {message.text && (
          <div className={`profile-alert ${message.type === "success" ? "is-success" : "is-error"}`}>
            {message.text}
            <button type="button" onClick={() => setMessage({ type: "", text: "" })}>Close</button>
          </div>
        )}

        <section className="profile-layout">
          <aside className="profile-side">
            <div className="profile-side-card">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar large">
                  {avatarUrl ? <img src={avatarUrl} alt={profileData?.name || "User profile"} /> : initials}
                </div>
                <label className="profile-avatar-upload">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} />
                  {avatarUploading ? <RiUploadCloud2Line /> : <RiCameraLine />}
                  <span>{avatarUploading ? "Uploading..." : "Upload Photo"}</span>
                </label>
              </div>
              <h2>{profileData?.name || "User"}</h2>
              <div className="profile-side-meta">
                <div>
                  <span className="profile-meta-icon"><RiWallet3Line /></span>
                  <div>
                    <span>Wallet</span>
                    <strong>{formatMoney(profileData?.wallet_balance)}</strong>
                  </div>
                </div>
                <div>
                  <span className="profile-meta-icon"><RiShieldCheckLine /></span>
                  <div>
                    <span>Member Since</span>
                    <strong>{formatDate(profileData?.created_at)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="profile-card">
            <div className="profile-tabs">
              <button
                type="button"
                className={activeTab === "profile" ? "is-active" : ""}
                onClick={() => setActiveTab("profile")}
              >
                <RiUser3Line />
                Profile Information
              </button>
              <button
                type="button"
                className={activeTab === "password" ? "is-active" : ""}
                onClick={() => setActiveTab("password")}
              >
                <RiLockPasswordLine />
                Change Password
              </button>
            </div>

            {activeTab === "profile" ? (
              <form className="profile-form" onSubmit={handleProfileUpdate}>
                <label>
                  <span>Full Name</span>
                  <div className="profile-input">
                    <RiUser3Line />
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={profileForm.name}
                      onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                      required
                    />
                  </div>
                  {validationErrors.name && <small>{validationErrors.name[0]}</small>}
                </label>

                <label>
                  <span>Email Address</span>
                  <div className="profile-input">
                    <RiMailLine />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={profileForm.email}
                      onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                      required
                    />
                  </div>
                  {validationErrors.email && <small>{validationErrors.email[0]}</small>}
                </label>

                <button type="submit" className="profile-submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              </form>
            ) : (
              <form className="profile-form" onSubmit={handlePasswordChange}>
                {[
                  { key: "current_password", label: "Current Password" },
                  { key: "new_password", label: "New Password" },
                  { key: "new_password_confirmation", label: "Confirm New Password" },
                ].map((field) => (
                  <label key={field.key}>
                    <span>{field.label}</span>
                    <div className="profile-input">
                      <RiLockPasswordLine />
                      <input
                        type={showPasswords[field.key] ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={passwordForm[field.key]}
                        onChange={(event) => handlePasswordInput(field.key, event.target.value)}
                        required
                        minLength={field.key === "current_password" ? undefined : 6}
                      />
                      <button
                        type="button"
                        className="profile-password-toggle"
                        onClick={() => togglePassword(field.key)}
                        aria-label={showPasswords[field.key] ? "Hide password" : "Show password"}
                      >
                        {showPasswords[field.key] ? <RiEyeOffLine /> : <RiEyeLine />}
                      </button>
                    </div>
                    {validationErrors[field.key] && <small>{validationErrors[field.key][0]}</small>}
                  </label>
                ))}

                {passwordMatch !== null && (
                  <div className={`profile-password-note ${passwordMatch ? "is-valid" : "is-invalid"}`}>
                    {passwordMatch ? "Passwords match." : "Passwords do not match."}
                  </div>
                )}

                <button type="submit" className="profile-submit" disabled={loading || passwordMatch === false}>
                  {loading ? "Changing Password..." : "Change Password"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
