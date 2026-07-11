import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCameraLine,
  RiCalendarCheckLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiDownload2Line,
  RiEdit2Line,
  RiLockPasswordLine,
  RiLogoutBoxRLine,
  RiMailLine,
  RiRefreshLine,
  RiSaveLine,
  RiSearchLine,
  RiShieldUserLine,
  RiTimeLine,
  RiUser3Line,
} from "react-icons/ri";
import { FiEdit, FiUser } from "react-icons/fi";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import api, {
  changePassword,
  clearAuthData,
  getProfile,
  logoutUser,
  updateProfile,
  uploadProfileAvatar,
} from "../api/client";
import { AuthContext } from "../contexts/AuthContext";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import "./css/MechanicDashboard.css";

const emptyPagination = {
  current_page: 1,
  last_page: 1,
  total: 0,
};

const formatDate = (dateString) => {
  if (!dateString) return "Not scheduled";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price) => `BDT ${Number.parseFloat(price || 0).toFixed(2)}`;
const normalizeStatus = (status = "") => status.replaceAll("_", " ");

export default function MechanicDashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    confirmed_orders: 0,
    in_progress_orders: 0,
    completed_today: 0,
    total_assigned: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loadingButtons, setLoadingButtons] = useState({});
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModal, setProfileModal] = useState("");
  const [profileData, setProfileData] = useState(user || null);
  const [profileForm, setProfileForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/mechanic/orders", {
        params: {
          page,
          per_page: 10,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(searchTerm.trim() ? { q: searchTerm.trim() } : {}),
        },
      });

      if (response.data.success) {
        const payload = response.data.data;
        setOrders(payload?.data || payload || []);
        setPagination({
          current_page: payload?.current_page || 1,
          last_page: payload?.last_page || 1,
          total: payload?.total || 0,
        });
      }
    } catch (error) {
      console.error("Mechanic orders fetch error:", error);
      showErrorToast("Failed to load orders", error.response?.data?.message || "Please try again later.");
      setOrders([]);
      setPagination(emptyPagination);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/mechanic/dashboard-stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Mechanic stats fetch error:", error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshProfile = useCallback(async () => {
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
      console.error("Mechanic profile fetch error:", error);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const syncStoredUser = (nextUser) => {
    setUser(nextUser);
    setProfileData(nextUser);
    setProfileForm({
      name: nextUser.name || "",
      email: nextUser.email || "",
    });

    const serialized = JSON.stringify(nextUser);
    if (localStorage.getItem("user")) {
      localStorage.setItem("user", serialized);
    }
    if (sessionStorage.getItem("user")) {
      sessionStorage.setItem("user", serialized);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([fetchOrders(), fetchStats()]);
  };

  const startService = async (orderId) => {
    const result = await Swal.fire({
      title: "Start service?",
      text: "This order will move to in progress.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00b8c4",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Start Service",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingButtons((prev) => ({ ...prev, [orderId]: true }));
      const response = await api.post(`/mechanic/orders/${orderId}/start`);

      if (response.data.success) {
        showSuccessToast("Service Started", "Assigned service has been started.");
        await handleRefresh();
      }
    } catch (error) {
      showErrorToast("Failed to start service", error.response?.data?.message || "Please try again.");
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const completeService = async (orderId) => {
    const result = await Swal.fire({
      title: "Complete service?",
      text: "Invoice will be generated after completion.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00b8c4",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Complete Service",
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingButtons((prev) => ({ ...prev, [orderId]: true }));
      const response = await api.post(`/mechanic/orders/${orderId}/complete`);

      if (response.data.success) {
        showSuccessToast("Service Completed", "Invoice has been generated successfully.");
        await handleRefresh();
      }
    } catch (error) {
      showErrorToast("Failed to complete service", error.response?.data?.message || "Please try again.");
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const downloadSlip = async (order) => {
    try {
      const response = await api.get(`/mechanic/orders/${order.id}/download-slip`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `booking-slip-${order.slip_number || order.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccessToast("Slip Downloaded", "Booking slip has been downloaded.");
    } catch (error) {
      showErrorToast("Download Failed", error.response?.data?.message || "Failed to download slip.");
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: "Ready for Service",
        value: stats.confirmed_orders || 0,
        icon: RiTimeLine,
        tone: "cyan",
      },
      {
        label: "In Progress",
        value: stats.in_progress_orders || 0,
        icon: HiWrenchScrewdriver,
        tone: "amber",
      },
      {
        label: "Completed Today",
        value: stats.completed_today || 0,
        icon: RiCheckboxCircleLine,
        tone: "green",
      },
      {
        label: "Total Assigned",
        value: stats.total_assigned || 0,
        icon: RiCalendarCheckLine,
        tone: "blue",
      },
    ],
    [stats]
  );

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const openProfileModal = (mode) => {
    setProfileDropdownOpen(false);
    setProfileModal(mode);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileSaving(true);

    try {
      const response = await updateProfile(profileForm);
      if (response.success) {
        syncStoredUser(response.user);
        showSuccessToast("Profile updated", "Your profile information has been updated.");
        setProfileModal("");
      }
    } catch (error) {
      showErrorToast("Update failed", error.response?.data?.message || "Please check your profile information.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      showErrorToast("Password mismatch", "New password and confirmation must match.");
      return;
    }

    setProfileSaving(true);
    try {
      const response = await changePassword(passwordForm);
      if (response.success) {
        showSuccessToast("Password updated", "Your password has been changed successfully.");
        setPasswordForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
        setProfileModal("");
      }
    } catch (error) {
      showErrorToast("Password update failed", error.response?.data?.message || "Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const response = await uploadProfileAvatar(file);
      if (response.success) {
        syncStoredUser(response.user);
        showSuccessToast("Photo updated", "Your profile picture has been updated.");
      }
    } catch (error) {
      showErrorToast("Upload failed", error.response?.data?.message || "Please choose a valid image.");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Mechanic logout error:", error);
      clearAuthData();
    } finally {
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  const activeProfile = profileData || user || {};
  const profileName = activeProfile.name || "Mechanic";
  const profileEmail = activeProfile.email || "No email available";
  const profileInitial = profileName.charAt(0).toUpperCase();

  return (
    <main className="mechanic-page">
      <div className="mechanic-shell">
        <section className="mechanic-topbar">
          <div>
            <strong>Mechanic Panel</strong>
          </div>
          <div className="mechanic-profile-menu">
            <button
              type="button"
              className="mechanic-profile-trigger"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-expanded={profileDropdownOpen}
            >
              <span className="mechanic-avatar">
                {activeProfile.avatar_url ? <img src={activeProfile.avatar_url} alt={profileName} /> : profileInitial}
              </span>
              <span>
                <strong>{profileName}</strong>
              </span>
              <RiArrowDownSLine />
            </button>

            {profileDropdownOpen && (
              <div className="mechanic-profile-dropdown">                
                <button type="button" onClick={() => openProfileModal("profile")}>
                  <FiUser />
                  Profile Info
                </button>
                <button type="button" onClick={() => openProfileModal("password")}>
                  <RiLockPasswordLine />
                  Change Password
                </button>
                <button type="button" className="is-danger" onClick={handleLogout}>
                  <RiLogoutBoxRLine />
                  Logout
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="mechanic-hero">
          <div className="mechanic-hero-copy">
            <div>
              <span>Mechanic Workspace</span>
              <h1>Assigned Service Orders</h1>
            </div>
            <button type="button" className="mechanic-hero-refresh" onClick={handleRefresh} disabled={loading}>
              <RiRefreshLine className={loading ? "is-spinning" : ""} />
              Refresh
            </button>
          </div>
        </section>

        <section className="mechanic-stat-grid">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <article className={`mechanic-stat-card is-${item.tone}`} key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="mechanic-stat-icon">
                  <Icon />
                </div>
              </article>
            );
          })}
        </section>

        <section className="mechanic-toolbar">
          <div className="mechanic-search">
            <RiSearchLine />
            <input
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search order, customer, or service"
            />
          </div>
          <select value={statusFilter} onChange={handleStatusChange}>
            <option value="">All Assigned Orders</option>
            <option value="confirmed">Ready for Service</option>
            <option value="in_progress">In Progress</option>
          </select>
          <button type="button" className="mechanic-clear" onClick={() => { setStatusFilter(""); setSearchTerm(""); setPage(1); }}>
            Clear
          </button>
        </section>

        <section className="mechanic-orders-panel">
          <div className="mechanic-panel-head">
            <div>
              <h2>Assigned services</h2>
            </div>
            <small>{pagination.total || orders.length} assigned</small>
          </div>

          {loading ? (
            <div className="mechanic-state">Loading assigned orders...</div>
          ) : orders.length > 0 ? (
            <>
              <div className="mechanic-order-list">
                {orders.map((order) => {
                  const isLoading = loadingButtons[order.id];
                  const isReady = order.status === "confirmed";
                  const isInProgress = order.status === "in_progress";

                  return (
                    <article className="mechanic-order-card" key={order.id}>
                      <div className="mechanic-order-id">
                        <span>Order</span>
                        <strong>#{order.id}</strong>
                      </div>

                      <div className="mechanic-order-main">
                        <div className="mechanic-user-icon">
                          <RiUser3Line />
                        </div>
                        <div>
                          <h3>{order.user?.name || "Customer"}</h3>
                          <p>{order.user?.email || "No email available"}</p>
                        </div>
                      </div>

                      <div className="mechanic-service-info">
                        <span>Service</span>
                        <strong>{order.service?.name || "Car Service"}</strong>
                        <p>{order.service?.duration || "Flexible"} • {formatPrice(order.service?.price)}</p>
                      </div>

                      <div className="mechanic-date-box">
                        <span>Booking Time</span>
                        <strong>{formatDate(order.booking_time)}</strong>
                      </div>

                      <div className="mechanic-status-box">
                        <span className={`mechanic-status is-${order.status}`}>{normalizeStatus(order.status)}</span>
                        {order.slip_number ? (
                          <button type="button" onClick={() => downloadSlip(order)}>
                            <RiDownload2Line />
                            Slip
                          </button>
                        ) : (
                          <small>No slip yet</small>
                        )}
                      </div>

                      <div className="mechanic-actions">
                        {isReady && (
                          <button type="button" className="is-start" onClick={() => startService(order.id)} disabled={isLoading}>
                            <HiWrenchScrewdriver />
                            {isLoading ? "Starting..." : "Start"}
                          </button>
                        )}
                        {isInProgress && (
                          <button type="button" className="is-complete" onClick={() => completeService(order.id)} disabled={isLoading}>
                            <RiCheckboxCircleLine />
                            {isLoading ? "Completing..." : "Complete"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {pagination.last_page > 1 && (
                <div className="mechanic-pagination">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                    <RiArrowLeftSLine />
                    Previous
                  </button>
                  <span>{pagination.current_page} / {pagination.last_page}</span>
                  <button type="button" disabled={page >= pagination.last_page} onClick={() => setPage((prev) => Math.min(pagination.last_page, prev + 1))}>
                    Next
                    <RiArrowRightSLine />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="mechanic-empty">
              <HiWrenchScrewdriver />
              <h3>No assigned orders found</h3>
            </div>
          )}
        </section>
      </div>

      {profileModal && (
        <div className="mechanic-modal" role="dialog" aria-modal="true">
          <div className="mechanic-modal-card">
            <div className="mechanic-modal-head">
              <div>
                <h2>{profileModal === "profile" ? "Profile Information" : "Change Password"}</h2>
              </div>
              <button type="button" onClick={() => setProfileModal("")}>
                <RiCloseLine />
              </button>
            </div>

            {profileModal === "profile" ? (
              <form className="mechanic-profile-form" onSubmit={handleProfileSubmit}>
                <div className="mechanic-profile-photo">
                  <span className="mechanic-avatar xlarge">
                    {activeProfile.avatar_url ? <img src={activeProfile.avatar_url} alt={profileName} /> : profileInitial}
                  </span>
                  <label>
                    {avatarUploading ? "Uploading..." : "Upload Photo"}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} />
                  </label>
                </div>

                <label>
                  <span><RiUser3Line /> Name</span>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Your name"
                    required
                  />
                </label>
                <label>
                  <span><RiMailLine /> Email</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="Your email"
                    required
                  />
                </label>
                <label>
                  <span><RiShieldUserLine /> Role</span>
                  <input type="text" value={activeProfile.role || "mechanic"} disabled />
                </label>
                <button type="submit" disabled={profileSaving}>
                  <RiSaveLine />
                  {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            ) : (
              <form className="mechanic-profile-form" onSubmit={handlePasswordSubmit}>
                <label>
                  <span>Current Password</span>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
                    placeholder="Current password"
                    required
                  />
                </label>
                <label>
                  <span>New Password</span>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                    placeholder="New password"
                    required
                  />
                </label>
                <label>
                  <span>Confirm Password</span>
                  <input
                    type="password"
                    value={passwordForm.new_password_confirmation}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password_confirmation: event.target.value }))}
                    placeholder="Confirm new password"
                    required
                  />
                </label>
                <button type="submit" disabled={profileSaving}>
                  <RiLockPasswordLine />
                  {profileSaving ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
