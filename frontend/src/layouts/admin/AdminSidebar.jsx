import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  RiArrowDownSLine,
  RiBarChartBoxLine,
  RiBookOpenLine,
  RiDashboardLine,
  RiFileList3Line,
  RiMailLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiParkingBoxLine,
  RiSettings3Line,
  RiTeamLine,
  RiUser3Line,
  RiWallet3Line,
} from "react-icons/ri";
import { GrUserAdmin } from "react-icons/gr";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { AuthContext } from "../../contexts/AuthContext";
import { hasAnyPermission, hasPermission } from "../../utils/permissions";

const groups = [
  {
    id: "parking",
    label: "Parking",
    icon: RiParkingBoxLine,
    paths: ["/admin/parkings", "/admin/slots", "/admin/bookings"],
    permissions: ["parkings.view", "slots.view", "bookings.view"],
    items: [
      { label: "Parking Lots", to: "/admin/parkings", permission: "parkings.view" },
      { label: "Parking Slots", to: "/admin/slots", permission: "slots.view" },
      { label: "Bookings", to: "/admin/bookings", permission: "bookings.view" },
    ],
  },
  {
    id: "services",
    label: "Car Services",
    icon: HiWrenchScrewdriver,
    paths: ["/admin/service-orders", "/admin/services", "/admin/service-centers"],
    permissions: ["services.view", "service_orders.view", "service_centers.view"],
    items: [      
      { label: "Services", to: "/admin/services", permission: "services.view" },
      { label: "Service Centers", to: "/admin/service-centers", permission: "service_centers.view" },
      { label: "Orders", to: "/admin/service-orders", permission: "service_orders.view" },
    ],
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: RiWallet3Line,
    paths: ["/admin/wallet", "/admin/wallet-transactions", "/admin/payment-methods"],
    permissions: ["wallet.view", "wallet_transactions.view", "payment_methods.view"],
    items: [
      { label: "Overview", to: "/admin/wallet", permission: "wallet.view" },
      { label: "Transactions", to: "/admin/wallet-transactions", permission: "wallet_transactions.view" },
      { label: "Payment Methods", to: "/admin/payment-methods", permission: "payment_methods.view" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: RiBarChartBoxLine,
    paths: ["/admin/reports"],
    permissions: ["reports.view"],
    items: [
      { label: "Parkings", to: "/admin/reports/parking", permission: "reports.view" },
      { label: "Service", to: "/admin/reports/services", permission: "reports.view" },
    ],
  },
  {
    id: "team_access",
    label: "Team & Access",
    icon: RiTeamLine,
    paths: ["/admin/staff", "/admin/roles", "/admin/team-members"],
    permissions: ["staff.view", "roles.view", "team_members.view"],
    items: [
      { label: "Staff", to: "/admin/staff", permission: "staff.view" },
      { label: "Roles", to: "/admin/roles", permission: "roles.view" },
      { label: "Team Members", to: "/admin/team-members", permission: "team_members.view" },
    ],
  },
];

const links = [
  { label: "Users", to: "/admin/users", icon: RiUser3Line, permission: "users.view" },
  { label: "Checkouts", to: "/admin/checkouts", icon: RiFileList3Line, permission: "checkouts.view" },
  { label: "Messages", to: "/admin/messages", icon: RiMailLine, permission: "messages.view" },
  { label: "Contacts", to: "/admin/contacts", icon: RiBookOpenLine, permission: "contacts.view" },
  { label: "Site Settings", to: "/admin/site-settings", icon: RiSettings3Line, permission: "site_settings.view" },
];

const matchesRoute = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

export default function AdminSidebar({ isOpen, onToggle }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});

  const activeGroupIds = useMemo(
    () =>
      groups
        .filter((group) => group.paths.some((path) => matchesRoute(location.pathname, path)))
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

  if (!user || !["admin", "manager"].includes(user.role)) return null;

  const isActive = (path) => (path === "/admin" ? location.pathname === "/admin" : matchesRoute(location.pathname, path));

  const toggleGroup = (id) => {
    setOpenGroups((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "is-open" : "is-collapsed"}`}>
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-title">
          <GrUserAdmin />
          <span>{user.role === "manager" ? "Manager Panel" : "Admin Panel"}</span>
        </div>
        <button type="button" className="admin-sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {isOpen ? <RiMenuFoldLine /> : <RiMenuUnfoldLine />}
        </button>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {(user.role === "admin" || hasPermission(user, "admin.dashboard")) && (
          <Link to="/admin" className={`admin-nav-link ${isActive("/admin") ? "is-active" : ""}`} title="Dashboard">
            <RiDashboardLine />
            {isOpen && <span>Dashboard</span>}
          </Link>
        )}

        <div className="admin-nav-section">
          {isOpen && <p>Manage</p>}
          {groups
            .filter((group) => {
              if (user.role === "admin") return true;
              const visibleItems = group.items.filter((item) => hasPermission(user, item.permission));
              return visibleItems.length > 0 && hasAnyPermission(user, group.permissions || []);
            })
            .map((group) => {
            const Icon = group.icon;
            const active = group.paths.some((path) => matchesRoute(location.pathname, path));
            const expanded = openGroups[group.id] || active;
            const visibleItems = group.items.filter((item) => user.role === "admin" || hasPermission(user, item.permission));

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
                    {visibleItems.map((item) => (
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
          {links.filter((link) => user.role === "admin" || hasPermission(user, link.permission)).map((link) => {
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
    </aside>
  );
}
