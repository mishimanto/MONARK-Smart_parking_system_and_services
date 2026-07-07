import React, { useContext, useEffect, useState } from "react";
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
  FaUserEdit,
  FaUserTie,
  FaWrench,
  FaKey,
} from "react-icons/fa";
import { AuthContext } from "../contexts/AuthContext";
import { API_BASE_URL, clearAuthData, getStoredToken, logoutUser } from "../api/client";
import "./css/Navbar.css";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contact Us", to: "/contact" },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: FaFacebookF },
  { label: "Twitter", href: "#", icon: FaTwitter },
  { label: "LinkedIn", href: "#", icon: FaLinkedinIn },
  { label: "Instagram", href: "#", icon: FaInstagram },
];

export default function Navbar() {
  const { user, setUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/contact-info`)
      .then((res) => res.json())
      .then((data) => setContactInfo(data))
      .catch((err) => console.error("Error fetching contact info:", err));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setServicesDropdownOpen(false);
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
          : { label: "Dashboard", to: "/dashboard", icon: FaTachometerAlt };

  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <div className="site-topbar">
        <div className="site-header-inner site-topbar-inner">
          <div className="site-contact-list">
            {contactInfo ? (
              <>                
                <span className="inline-flex items-center gap-2">
                  <FaPhone />
                  {contactInfo.phone}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FaEnvelope />
                  {contactInfo.email}
                </span>
              </>
            ) : (
              <span className="text-slate-300">Loading contact info...</span>
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
            <span className="site-brand-name">MONARK</span>
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

            <div className="relative">
              <button
                type="button"
                className={`site-nav-link ${servicesDropdownOpen ? "is-active" : ""}`}
                onClick={() => {
                  setServicesDropdownOpen((open) => !open);
                  setUserDropdownOpen(false);
                }}
              >
                Services
                <FaChevronDown className={`text-xs transition ${servicesDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {servicesDropdownOpen && (
                <div className="site-dropdown absolute left-0 mt-2 w-48 overflow-hidden py-2">
                  <Link className="site-dropdown-link" to="/all-parkings">
                    Parking Lots
                  </Link>
                  <Link className="site-dropdown-link" to="/services">
                    Car Services
                  </Link>
                </div>
              )}
            </div>
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
                  onClick={() => {
                    setUserDropdownOpen((open) => !open);
                    setServicesDropdownOpen(false);
                  }}
                >
                  {user.name || user.email}
                  <FaChevronDown className={`text-xs transition ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {userDropdownOpen && (
                  <div className="site-dropdown site-user-dropdown absolute right-0 mt-3 w-54 overflow-hidden">
                    
                    <Link className="site-dropdown-link" to={dashboardLink.to}>
                      <dashboardLink.icon className="text-xs" />
                      {dashboardLink.label}
                    </Link>
                    <Link className="site-dropdown-link" to="/user-profile">
                      <FaUserEdit />
                      My Profile
                    </Link>
                    <Link className="site-dropdown-link" to="/user-profile">
                      <FaKey />
                      Change Password
                    </Link>
                   
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
                  {React.createElement(link.icon, { className: "text-xs" })}
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
                  <Link className={linkClass("/user-profile")} to="/user-profile">
                    My Profile
                  </Link>
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
