import React, { Suspense, lazy, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import DashboardHistory from "./components/DashboardHistory";
import AuthLayout from "./layouts/AuthLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import ManagerDashboard from "./components/ManagerDashboard";
import AboutUs from './components/About';
import ContactUs from './components/Contact';
import Topup from './components/Topup';
import VerifyTransaction from './components/VerifyTransaction';
import { StorefrontLoaderGate } from "./components/StorefrontLoader";

import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import AdminLayout from "./layouts/AdminLayout";
import AdminPanelLoader from "./layouts/admin/AdminPanelLoader";
import { firstAllowedAdminPath, hasPermission } from "./utils/permissions";

const ParkingDetail = lazy(() => import("./components/ParkingDetail"));
const Services = lazy(() => import("./components/Services"));
const ServiceDetail = lazy(() => import("./components/ServiceDetail"));
const PublicServiceCenters = lazy(() => import("./components/ServiceCenters"));
const MyServices = lazy(() => import("./components/MyServices"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UserProfile = lazy(() => import("./components/UserProfile"));
const AllParkings = lazy(() => import("./components/AllParkings"));
const MechanicDashboard = lazy(() => import("./components/MechanicDashboard"));

const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const AdminParkings = lazy(() => import("./pages/admin/AdminParkings"));
const AdminParkingForm = lazy(() => import("./pages/admin/AdminParkingForm"));
const AdminSlots = lazy(() => import("./pages/admin/AdminSlots"));
const AdminSlotForm = lazy(() => import("./pages/admin/AdminSlotForm"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminStaff = lazy(() => import("./pages/admin/AdminStaff"));
const AdminStaffForm = lazy(() => import("./pages/admin/AdminStaffForm"));
const AdminRoles = lazy(() => import("./pages/admin/AdminRoles"));
const AdminRoleForm = lazy(() => import("./pages/admin/AdminRoleForm"));
const AdminWallet = lazy(() => import("./pages/admin/AdminWallet"));
const AdminPaymentMethods = lazy(() => import("./pages/admin/AdminPaymentMethods"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const Checkouts = lazy(() => import("./pages/admin/Checkouts"));
const WalletTransactions = lazy(() => import("./pages/admin/WalletTransactions"));
const AdminServiceOrders = lazy(() => import("./pages/admin/AdminServiceOrders"));
const AdminServices = lazy(() => import("./pages/admin/AdminService"));
const AdminServiceForm = lazy(() => import("./pages/admin/AdminServiceForm"));
const Profile = lazy(() => import("./pages/admin/Profile"));
const Contacts = lazy(() => import("./pages/admin/Contacts"));
const Messages = lazy(() => import("./pages/admin/Messages"));
const ServiceCenters = lazy(() => import("./pages/admin/ServiceCenters"));
const ServiceCenterForm = lazy(() => import("./pages/admin/ServiceCenterForm"));
const SiteSettings = lazy(() => import("./pages/admin/SiteSettings"));
const TeamMembers = lazy(() => import("./pages/admin/TeamMembers"));
const TeamMemberForm = lazy(() => import("./pages/admin/TeamMemberForm"));

// Navbar visibility check component
function NavbarWrapper() {
  const location = useLocation();
  const hideNavbarPaths = ["/admin", "/manager", "/mechanic", "/login", "/register", "/forgot-password", "/reset-password", "/topup", "/verify-transaction"];

  const shouldShowNavbar = !hideNavbarPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return shouldShowNavbar ? <Navbar /> : null;
}

function FooterWrapper() {
  const location = useLocation();
  const hideFooterPaths = ["/admin", "/manager", "/mechanic", "/login", "/register", "/forgot-password", "/reset-password", "/topup", "/verify-transaction"];

  const shouldShowFooter = !hideFooterPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return shouldShowFooter ? <Footer /> : null;
}

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);
  const mechanicDashboard = "/mechanic/dashboard";
  const mechanicLocked = (element) => (
    loading ? null : user?.role === "mechanic" ? <Navigate to={mechanicDashboard} replace /> : element
  );
  const userOnly = (element) => (
    loading ? null : user?.role === "user" ? element : <Navigate to={user?.role === "mechanic" ? mechanicDashboard : user ? "/" : "/login"} replace />
  );
  const adminShellAllowed = user?.role === "admin" || user?.role === "manager";
  const adminOnly = (element) => (
    loading ? null : user?.role === "admin" ? element : <AdminAccessDenied />
  );
  const permitted = (permission, element) => (
    loading ? null : adminShellAllowed && hasPermission(user, permission) ? element : <AdminAccessDenied />
  );
  const adminIndex = () => {
    if (loading) return null;
    if (!adminShellAllowed) return <Navigate to="/" replace />;
    if (hasPermission(user, "admin.dashboard")) return <AdminDashboard />;
    const target = firstAllowedAdminPath(user);
    return target !== "/admin" ? <Navigate to={target} replace /> : <AdminAccessDenied />;
  };

  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={mechanicLocked(<Home />)} />
      <Route element={<AuthLayout />}>
        <Route path="/register" element={mechanicLocked(<Register />)} />
        <Route path="/login" element={mechanicLocked(<Login />)} />
        <Route path="/forgot-password" element={mechanicLocked(<ForgotPassword />)} />
        <Route path="/reset-password" element={mechanicLocked(<ResetPassword />)} />
      </Route>
      <Route path="/all-parkings" element={mechanicLocked(<AllParkings />)} />
      <Route path="/about" element={mechanicLocked(<AboutUs />)} />
      <Route path="/contact" element={mechanicLocked(<ContactUs />)} />

      <Route path="/topup" element={userOnly(<Topup />)} />
      <Route path="/verify-transaction" element={userOnly(<VerifyTransaction />)} />
      <Route path="/services" element={mechanicLocked(<Services />)} />
      <Route path="/services/:id" element={mechanicLocked(<ServiceDetail />)} />
      <Route path="/service-centers" element={mechanicLocked(<PublicServiceCenters />)} />
      <Route path="/my-services" element={userOnly(<MyServices />)} />
      <Route path="/user-profile" element={loading ? null : user?.role === "user" ? <UserProfile /> : <Navigate to={user?.role === "mechanic" ? mechanicDashboard : "/login"} replace />} />
      
      {/* User Dashboard - only for regular users */}
      <Route
        path="/dashboard"
        element={
          userOnly(<Dashboard />)
        }
      />
      <Route
        path="/dashboard/overview"
        element={
          <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/dashboard/parking-overview"
        element={
          <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/dashboard/service-overview"
        element={
          <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/dashboard/history"
        element={
          <Navigate to="/dashboard/parking-history" replace />
        }
      />
      <Route
        path="/dashboard/parking-history"
        element={
          userOnly(<DashboardHistory type="parking" />)
        }
      />
      <Route
        path="/dashboard/service-history"
        element={
          userOnly(<DashboardHistory type="service" />)
        }
      />
      
      <Route
        path="/manager"
        element={
          loading ? null : user?.role === "manager" ? <Navigate to="/admin" replace /> : <Navigate to="/" />
        }
      />
      <Route path="/parking/:slug" element={mechanicLocked(<ParkingDetail />)} />

      {/* Admin nested route */}
      <Route
        path="/admin"
        element={
          loading ? <AdminPanelLoader /> : adminShellAllowed ? <AdminLayout /> : <Navigate to="/" />
        }
      >
        <Route index element={adminIndex()} />
        <Route path="parkings" element={permitted("parkings.view", <AdminParkings />)} />
        <Route path="parkings/new" element={permitted("parkings.create", <AdminParkingForm />)} />
        <Route path="parkings/:id/edit" element={permitted("parkings.update", <AdminParkingForm />)} />
        <Route path="slots" element={permitted("slots.view", <AdminSlots />)} />
        <Route path="slots/new" element={permitted("slots.create", <AdminSlotForm />)} />
        <Route path="slots/:id/edit" element={permitted("slots.update", <AdminSlotForm />)} />
        <Route path="bookings" element={permitted("bookings.view", <AdminBookings />)} />
        <Route path="users" element={permitted("users.view", <AdminUsers />)} />
        <Route path="staff" element={permitted("staff.view", <AdminStaff />)} />
        <Route path="staff/new" element={permitted("staff.create", <AdminStaffForm />)} />
        <Route path="staff/:id/edit" element={permitted("staff.update", <AdminStaffForm />)} />
        <Route path="roles" element={permitted("roles.view", <AdminRoles />)} />
        <Route path="roles/new" element={permitted("roles.create", <AdminRoleForm />)} />
        <Route path="roles/:id/edit" element={permitted("roles.update", <AdminRoleForm />)} />
        <Route path="wallet" element={permitted("wallet.view", <AdminWallet />)} />
        <Route path="payment-methods" element={permitted("payment_methods.view", <AdminPaymentMethods />)} />
        <Route path="reports" element={<Navigate to="/admin/reports/parking" replace />} />
        <Route path="reports/parking" element={permitted("reports.view", <AdminReports reportType="parking" />)} />
        <Route path="reports/services" element={permitted("reports.view", <AdminReports reportType="services" />)} />
        <Route path="checkouts" element={permitted("checkouts.view", <Checkouts />)} />
        <Route path="wallet-transactions" element={permitted("wallet_transactions.view", <WalletTransactions />)} />
        <Route path="service-orders" element={permitted("service_orders.view", <AdminServiceOrders />)} />
        <Route path="services" element={permitted("services.view", <AdminServices />)} />
        <Route path="services/new" element={permitted("services.create", <AdminServiceForm />)} />
        <Route path="services/:id/edit" element={permitted("services.update", <AdminServiceForm />)} />
        <Route path="profile" element={<Profile />} />
        <Route path="contacts" element={permitted("contacts.view", <Contacts />)} />
        <Route path="messages" element={permitted("messages.view", <Messages />)} />
        <Route path="team-members" element={permitted("team_members.view", <TeamMembers />)} />
        <Route path="team-members/new" element={permitted("team_members.create", <TeamMemberForm />)} />
        <Route path="team-members/:id/edit" element={permitted("team_members.update", <TeamMemberForm />)} />
        <Route path="site-settings" element={permitted("site_settings.view", <SiteSettings />)} />
        <Route path="service-centers" element={permitted("service_centers.view", <ServiceCenters />)} />
        <Route path="service-centers/new" element={permitted("service_centers.create", <ServiceCenterForm />)} />
        <Route path="service-centers/:id/edit" element={permitted("service_centers.update", <ServiceCenterForm />)} />
      </Route>

      {/* Mechanic Route - Separate from admin */}
      <Route
        path="/mechanic/dashboard"
        element={
          loading ? null : user?.role === "mechanic" ? <MechanicDashboard /> : <Navigate to="/" />
        }
      />

      <Route path="*" element={<Navigate to={user?.role === "mechanic" ? mechanicDashboard : "/"} replace />} />
    </Routes>
    </Suspense>
  );
}

function AdminAccessDenied() {
  return (
    <section className="parking-admin-page">
      <div className="pa-empty-state">
        <h3>Access denied</h3>
        <p>You do not have permission to open this admin section.</p>
      </div>
    </section>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <Router>
          <Toaster
            position="top-right"
            gutter={12}
            toastOptions={{
              style: {
                backgroundColor: "transparent",
                boxShadow: "none",
                padding: 0,
                maxWidth: "none",
              },
            }}
          />
          <NavbarWrapper />
          <AppRoutes />
          <FooterWrapper />
          <StorefrontLoaderGate />
        </Router>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
