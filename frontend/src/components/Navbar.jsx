import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaChevronDown,
  FaEnvelope,
  FaFacebookF,
  FaHome,
  FaInfoCircle,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhone,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTimes,
  FaTwitter,
  FaUserTie,
  FaWrench,
  FaKey,
} from "react-icons/fa";
import { RxDashboard } from "react-icons/rx";
import { LuUser } from "react-icons/lu";
import { AuthContext } from "../contexts/AuthContext";
import { clearAuthData, getStoredToken, logoutUser } from "../api/client";
import "./css/Navbar.css";
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { resolveAssetUrl } from "../utils/assets";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Contact Us", to: "/contact" },
  { label: "Parking Lots", to: "/all-parkings" },
  { label: "Services", to: "/services" },
];

export default function Navbar() {
  const { user, setUser, loading: authLoading } = useContext(AuthContext);
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const socialLinks = useMemo(
    () => [
      { label: "Facebook", href: settings.facebook_url, icon: FaFacebookF },
      { label: "Twitter", href: settings.twitter_url, icon: FaTwitter },
      { label: "LinkedIn", href: settings.linkedin_url, icon: FaLinkedinIn },
      { label: "Instagram", href: settings.instagram_url, icon: FaInstagram },
    ].filter((social) => Boolean(social.href)),
    [settings.facebook_url, settings.instagram_url, settings.linkedin_url, settings.twitter_url]
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    const token = getStoredToken();

    if (token) {
      try {
        await logoutUser();
      } catch (error) {
        console.error("Logout request failed:", error);
      }
    }

    clearAuthData();
    setUser(null);
    navigate("/login");
  };

  const isActive = (to) => location.pathname === to;

  const linkClass = (to) =>
    [
      "site-nav-link",
      isActive(to) ? "is-active" : "",
    ].join(" ");

  const dashboardLink =
    user?.role === "admin"
      ? { label: "Admin Panel", to: "/admin", icon: FaUserTie }
      : user?.role === "manager"
        ? { label: "Manager Panel", to: "/manager", icon: FaUserTie }
        : user?.role === "mechanic"
          ? { label: "Mechanic Panel", to: "/mechanic/dashboard", icon: FaWrench }
          : { label: "Dashboard", to: "/dashboard", icon: RxDashboard };
  const hasPanelAccess = ["admin", "manager", "mechanic"].includes(user?.role);

  const userDisplayName = user?.name || user?.email || "User";
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const userAvatar = resolveAssetUrl(user?.avatar_url || user?.avatar);

  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <div className="site-topbar">
        <div className="site-header-inner site-topbar-inner">
          <div className="site-contact-list">
            {settings.primary_phone || settings.support_email ? (
              <>
                <span className="inline-flex items-center gap-2">
                  <FaPhone />
                  {settings.primary_phone}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FaEnvelope />
                  {settings.support_email}
                </span>
              </>
            ) : (
              <span className="text-slate-300">{settings.business_hours}</span>
            )}
          </div>

          <div className="site-social-list">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="site-social-link"
              >
                {React.createElement(social.icon, { className: "text-sm" })}
              </a>
            ))}
          </div>
        </div>
      </div>

      <nav
        className={[
          "site-navbar",
          scrolled ? "is-scrolled" : "",
        ].join(" ")}
      >
        <div className="site-header-inner site-navbar-inner">
          <Link to="/" className="site-brand">
            {settings.logo ? (
              <img className="site-brand-logo" src={resolveAssetUrl(settings.logo)} alt={settings.site_name} />
            ) : (
              <span className="site-brand-name">{settings.site_name}</span>
            )}
          </Link>

          <button
            type="button"
            className="site-mobile-toggle lg:hidden"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className="site-nav-menu hidden lg:flex">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.icon && React.createElement(link.icon, { className: "text-xs" })}
                {link.label}
              </Link>
            ))}
          </div>

          <div className="site-auth-area hidden lg:flex">
            {authLoading ? null : !user ? (
              <Link
                to="/login"
                className="site-login-link"
              >
                Login/Register
              </Link>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  className="site-user-button"
                  onClick={() => setUserDropdownOpen((open) => !open)}
                >
                  <span className={`site-user-avatar ${userAvatar ? "has-image" : ""}`}>
                    <span className="site-user-avatar-initial">{userInitial}</span>
                    {userAvatar && (
                      <img
                        src={userAvatar}
                        alt={userDisplayName}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </span>
                  <span className="site-user-button-name" title={userDisplayName}>{userDisplayName}</span>
                  <FaChevronDown className={`text-xs transition ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="site-dropdown site-user-dropdown absolute right-0 mt-3 w-54 overflow-hidden">
                    <Link className="site-dropdown-link" to={dashboardLink.to}>
                      <dashboardLink.icon className="text-xs" />
                      {dashboardLink.label}
                    </Link>
                    {!hasPanelAccess && (
                      <>
                        <Link className="site-dropdown-link" to="/user-profile">
                          <LuUser />
                          My Profile
                        </Link>
                        <Link className="site-dropdown-link" to="/user-profile">
                          <FaKey />
                          Change Password
                        </Link>
                      </>
                    )}
                   
                    <div className="site-dropdown-divider" />
                    <button
                      type="button"
                      className="site-dropdown-link site-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="site-mobile-menu lg:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                  {link.icon && React.createElement(link.icon, { className: "text-xs" })}
                  {link.label}
                </Link>
              ))}
              <Link className={linkClass("/all-parkings")} to="/all-parkings">
                Parking Lots
              </Link>
              <Link className={linkClass("/services")} to="/services">
                Car Services
              </Link>
              {authLoading ? null : !user ? (
                <Link className="site-login-link mt-2 text-center" to="/login">
                  Login/Register
                </Link>
              ) : (
                <>
                  <Link className={linkClass(dashboardLink.to)} to={dashboardLink.to}>
                    {dashboardLink.label}
                  </Link>
                  {!hasPanelAccess && (
                    <Link className={linkClass("/user-profile")} to="/user-profile">
                      My Profile
                    </Link>
                  )}
                  <button
                    type="button"
                    className="mt-2 rounded-sm bg-red-50 px-4 py-2 text-left text-sm font-bold text-red-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
