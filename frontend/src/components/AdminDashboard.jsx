import React, { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  RiArrowRightLine,
  RiCalendarCheckLine,
  RiCarLine,
  RiFileList3Line,
  RiRefreshLine,
  RiTimeLine,
  RiUser3Line,
} from "react-icons/ri";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { API_BASE_URL } from "../api/client";
import "./css/AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    // Parking Stats
    totalParkings: 0,
    totalSlots: 0,
    availableSlots: 0,
    activeBookings: 0,
    totalUsers: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    
    // Service Stats 
    totalServices: 0,
    activeServices: 0,
    totalServiceOrders: 0,
    completedServiceOrders: 0,
    pendingServiceOrders: 0,
    inProgressServiceOrders: 0,
    cancelledServiceOrders: 0,
    totalServiceRevenue: 0,
    todayServiceRevenue: 0,
    monthlyServiceRevenue: 0,
    
    // Combined Stats 
    totalCombinedRevenue: 0,
    totalCombinedBookings: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [recentServiceOrders, setRecentServiceOrders] = useState([]);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dashboard = response.data?.data || {};
      setStats((previous) => ({
        ...previous,
        ...dashboard,
      }));
      setRecentBookings(dashboard.recentBookings || []);
      setRecentServiceOrders(dashboard.recentServiceOrders || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const normalizeStatus = (status = "unknown") => status.replaceAll("_", " ");

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-error">
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
          <button type="button" onClick={fetchDashboardData}>
            <RiRefreshLine />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const heroStats = [
    { label: "Total Revenue", value: formatCurrency(stats.totalCombinedRevenue), note: "Parking + services", icon: FaBangladeshiTakaSign },
    { label: "Total Bookings", value: stats.totalCombinedBookings, note: "All booking types", icon: RiCalendarCheckLine },
    { label: "Registered Users", value: stats.totalUsers, note: "Customer accounts", icon: RiUser3Line },
  ];

  const metricCards = [
    { label: "Parking Lots", value: stats.totalParkings, note: "Locations", icon: RiCarLine },
    { label: "Total Slots", value: stats.totalSlots, note: `${stats.availableSlots} available`, icon: RiFileList3Line },
    { label: "Active Parking", value: stats.activeBookings, note: "Running bookings", icon: RiTimeLine },
    { label: "Parking Revenue", value: formatCurrency(stats.totalRevenue), note: "Completed bookings", icon: FaBangladeshiTakaSign },
    { label: "Service Orders", value: stats.totalServiceOrders, note: `${stats.inProgressServiceOrders} in progress`, icon: HiWrenchScrewdriver },
    { label: "Service Revenue", value: formatCurrency(stats.totalServiceRevenue), note: "Completed services", icon: FaBangladeshiTakaSign },
  ];

  const parkingBreakdown = [
    { label: "Completed", value: stats.completedBookings },
    { label: "Pending", value: stats.pendingBookings },
    { label: "Active", value: stats.activeBookings },
  ];

  const serviceBreakdown = [
    { label: "Completed", value: stats.completedServiceOrders },
    { label: "Pending", value: stats.pendingServiceOrders },
    { label: "In Progress", value: stats.inProgressServiceOrders },
  ];

  const revenueRows = [
    { label: "Today", parking: stats.todayRevenue, service: stats.todayServiceRevenue },
    { label: "This Month", parking: stats.monthlyRevenue, service: stats.monthlyServiceRevenue },
    { label: "All Time", parking: stats.totalRevenue, service: stats.totalServiceRevenue },
  ];

  return (
    <div className="admin-dashboard-page">
      <section className="admin-dashboard-hero">
        <div>          
          <h2>Last updated {new Date().toLocaleDateString("en-BD")}</h2>          
        </div>
        <button type="button" onClick={fetchDashboardData}>
          <RiRefreshLine />
          Refresh Data
        </button>
      </section>

      <section className="admin-hero-stats">
        {heroStats.map((item) => {
          const Icon = item.icon;
          return (
            <article className="admin-hero-stat" key={item.label}>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                
              </div>
              <Icon />
            </article>
          );
        })}
      </section>

      <section className="admin-metric-grid">
        {metricCards.map((item) => {
          const Icon = item.icon;
          return (
            <article className="admin-metric-card" key={item.label}>
              <Icon />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              
            </article>
          );
        })}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-dashboard-panel">
          <div className="admin-panel-head">
            <div>
              <h3>Recent Parking Bookings</h3>
            </div>
            <Link to="/admin/bookings">
              View All
            </Link>
          </div>
          <div className="admin-record-list">
            {recentBookings.length > 0 ? recentBookings.map((booking) => (
              <article className="admin-record-card" key={booking.id}>
                <div>
                  <span>#{booking.id}</span>
                  <h4>{booking.parking?.name || "Parking Location"}</h4>
                  <p>{booking.user?.name || "N/A"} • Slot {booking.slot?.slot_code || "N/A"}</p>
                </div>
                <div>
                  <strong>{formatCurrency(booking.total_price)}</strong>
                  <small>{normalizeStatus(booking.status)}</small>
                </div>
              </article>
            )) : (
              <div className="admin-empty-state">No recent parking bookings</div>
            )}
          </div>
          <div className="admin-breakdown-row">
            {parkingBreakdown.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-dashboard-panel">
          <div className="admin-panel-head">
            <div>
              <h3>Recent Service Orders</h3>
            </div>
            <Link to="/admin/service-orders">
              View All
            </Link>
          </div>
          <div className="admin-record-list">
            {recentServiceOrders.length > 0 ? recentServiceOrders.map((order) => (
              <article className="admin-record-card" key={order.id}>
                <div>
                  <span>#{order.id}</span>
                  <h4>{order.service?.name || "Car Service"}</h4>
                  <p>{order.user?.name || "N/A"}</p>
                </div>
                <div>
                  <strong>{formatCurrency(order.service?.price)}</strong>
                  <small>{normalizeStatus(order.status)}</small>
                </div>
              </article>
            )) : (
              <div className="admin-empty-state">No recent service orders</div>
            )}
          </div>
          <div className="admin-breakdown-row">
            {serviceBreakdown.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-dashboard-panel">
        <div className="admin-panel-head">
          <div>
            <h3>Revenue Summary</h3>
          </div>
        </div>
        <div className="admin-revenue-table">
          <div className="admin-revenue-head">
            <span>Period</span>
            <span>Parking</span>
            <span>Services</span>
            <span>Total</span>
          </div>
          {revenueRows.map((row) => (
            <div className="admin-revenue-row" key={row.label}>
              <span>{row.label}</span>
              <strong>{formatCurrency(row.parking)}</strong>
              <strong>{formatCurrency(row.service)}</strong>
              <strong>{formatCurrency(Number(row.parking || 0) + Number(row.service || 0))}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
