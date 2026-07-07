// src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../pages/admin/AdminHeader";
import AdminFooter from "../pages/admin/AdminFooter";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sidebar state preserve korbe even route change holeo
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    if (savedState !== null) {
      setSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  // Sidebar state change hole save kora
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`admin-layout ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="admin-main">
        <AdminHeader />
        <main className="admin-content">
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
