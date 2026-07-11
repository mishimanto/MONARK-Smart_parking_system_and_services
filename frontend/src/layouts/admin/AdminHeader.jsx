import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  RiArrowDownSLine,
  RiExternalLinkLine,
  RiLogoutBoxRLine,
  RiUser3Line,
} from "react-icons/ri";
import { AuthContext } from "../../contexts/AuthContext";
import { clearAuthData, getStoredToken, logoutUser } from "../../api/client";

const titles = [
  { path: "/admin/service-orders", title: "Service Orders" },
  { path: "/admin/service-centers", title: "Service Centers" },
  { path: "/admin/wallet-transactions", title: "Wallet Transactions" },
  { path: "/admin/payment-methods", title: "Payment Methods" },
  { path: "/admin/parkings", title: "Parking Lots" },
  { path: "/admin/slots", title: "Parking Slots" },
  { path: "/admin/bookings", title: "Bookings" },
  { path: "/admin/users", title: "Users" },
  { path: "/admin/staff", title: "Staff" },
  { path: "/admin/roles", title: "Roles" },
  { path: "/admin/checkouts", title: "Checkouts" },
  { path: "/admin/wallet", title: "Wallet Overview" },
  { path: "/admin/reports/parking", title: "Parking Reports" },
  { path: "/admin/reports/services", title: "Service Reports" },
  { path: "/admin/reports", title: "Reports" },
  { path: "/admin/messages", title: "Messages" },
  { path: "/admin/contacts", title: "Contacts" },
  { path: "/admin/services", title: "Services" },
  { path: "/admin/profile", title: "Admin Profile" },
];

export default function AdminHeader() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const match = titles.find((item) => location.pathname.startsWith(item.path));
    return match?.title || "Dashboard";
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      if (getStoredToken()) {
        await logoutUser();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearAuthData();
      localStorage.removeItem("sidebarOpen");
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header-title">
        
        <h1>{pageTitle}</h1>
      </div>

      <div className="admin-header-actions">
        <Link to="/" target="_blank" className="admin-header-link">
          <RiExternalLinkLine />
          Visit Site
        </Link>

        <div className="admin-profile-menu" ref={dropdownRef}>
          <button type="button" className="admin-profile-trigger" onClick={() => setDropdownOpen((open) => !open)}>
            <span>{(user?.name || "A").charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user?.name || "Admin"}</strong>
            </div>
            <RiArrowDownSLine className={dropdownOpen ? "is-open" : ""} />
          </button>

          {dropdownOpen && (
            <div className="admin-profile-dropdown">
              <button
                type="button"
                onClick={() => {
                  navigate("/admin/profile");
                  setDropdownOpen(false);
                }}
              >
                <RiUser3Line />
                Profile
              </button>
              <button type="button" className="is-danger" onClick={handleLogout}>
                <RiLogoutBoxRLine />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
