import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  RiArrowDownSLine,
  RiBarChartBoxLine,
  RiBookOpenLine,
  RiDashboardLine,
  RiFileList3Line,
  RiMailLine,
  RiMapPinLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiParkingBoxLine,
  RiServiceLine,
  RiUser3Line,
  RiWallet3Line,
} from "react-icons/ri";
import { AuthContext } from "../contexts/AuthContext";

const groups = [
  {
    id: "parking",
    label: "Parking",
    icon: RiParkingBoxLine,
    paths: ["/admin/parkings", "/admin/slots", "/admin/bookings"],
    items: [
      { label: "Parking Lots", to: "/admin/parkings" },
      { label: "Parking Slots", to: "/admin/slots" },
      { label: "Bookings", to: "/admin/bookings" },
    ],
  },
  {
    id: "services",
    label: "Car Services",
    icon: RiServiceLine,
    paths: ["/admin/service-orders", "/admin/services", "/admin/service-centers"],
    items: [
      { label: "Orders", to: "/admin/service-orders" },
      { label: "Services", to: "/admin/services" },
      { label: "Service Centers", to: "/admin/service-centers" },
    ],
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: RiWallet3Line,
    paths: ["/admin/wallet", "/admin/wallet-transactions"],
    items: [
      { label: "Overview", to: "/admin/wallet" },
      { label: "Transactions", to: "/admin/wallet-transactions" },
    ],
  },
];

const links = [
  { label: "Users", to: "/admin/users", icon: RiUser3Line },
  { label: "Checkouts", to: "/admin/checkouts", icon: RiFileList3Line },
  { label: "Reports", to: "/admin/reports", icon: RiBarChartBoxLine },
  { label: "Messages", to: "/admin/messages", icon: RiMailLine },
  { label: "Contacts", to: "/admin/contacts", icon: RiBookOpenLine },
];

export default function Sidebar({ isOpen, onToggle }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});

  const activeGroupIds = useMemo(
    () =>
      groups
        .filter((group) => group.paths.some((path) => location.pathname.startsWith(path)))
        .map((group) => group.id),
    [location.pathname]
  );

  useEffect(() => {
    setOpenGroups((previous) => {
      const next = { ...previous };
      activeGroupIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [activeGroupIds]);

  if (!user || user.role !== "admin") return null;

  const isActive = (path) => (path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path));

  const toggleGroup = (id) => {
    setOpenGroups((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "is-open" : "is-collapsed"}`}>
      <div className="admin-sidebar-brand">
        <span>
          <RiDashboardLine />
            Admin Panel
          </span>
        <button type="button" className="admin-sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {isOpen ? <RiMenuFoldLine /> : <RiMenuUnfoldLine />}
        </button>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        <Link to="/admin" className={`admin-nav-link ${isActive("/admin") ? "is-active" : ""}`} title="Dashboard">
          <RiDashboardLine />
          {isOpen && <span>Dashboard</span>}
        </Link>

        <div className="admin-nav-section">
          {isOpen && <p>Manage</p>}
          {groups.map((group) => {
            const Icon = group.icon;
            const active = group.paths.some((path) => location.pathname.startsWith(path));
            const expanded = openGroups[group.id] || active;

            return (
              <div className="admin-nav-group" key={group.id}>
                <button
                  type="button"
                  className={`admin-nav-link admin-nav-group-btn ${active ? "is-active" : ""}`}
                  onClick={() => (isOpen ? toggleGroup(group.id) : undefined)}
                  title={group.label}
                >
                  <Icon />
                  {isOpen && (
                    <>
                      <span>{group.label}</span>
                      <RiArrowDownSLine className={`admin-nav-chevron ${expanded ? "is-open" : ""}`} />
                    </>
                  )}
                </button>

                {isOpen && expanded && (
                  <div className="admin-nav-submenu">
                    {group.items.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`admin-nav-subitem ${isActive(item.to) ? "is-active" : ""}`}
                      >
                        <span />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="admin-nav-section">
          {isOpen && <p>Operations</p>}
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.to} to={link.to} className={`admin-nav-link ${isActive(link.to) ? "is-active" : ""}`} title={link.label}>
                <Icon />
                {isOpen && <span>{link.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="admin-sidebar-footer">
        <RiMapPinLine />
        {isOpen && (
          <div>
            <strong>Admin Workspace</strong>
            <span>Narayanganj, Dhaka</span>
          </div>
        )}
      </div>
    </aside>
  );
}
