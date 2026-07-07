import React, { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  RiArrowRightLine,
  RiCalendarCheckLine,
  RiCarLine,
  RiFileList3Line,
  RiRefreshLine,
  RiServiceLine,
  RiTimeLine,
  RiUser3Line,
  RiWallet3Line,
} from "react-icons/ri";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      const [parkingsRes, bookingsRes, usersRes, slotsRes, servicesRes, serviceOrdersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/parkings`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Parkings API error:', err.message);
          return { data: { data: [] } };
        }),
        
        axios.get(`${API_BASE_URL}/admin/bookings?per_page=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Bookings API error:', err.message);
          return { data: { data: [] } };
        }),
        
        axios.get(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Users API error:', err.message);
          return { data: { data: [] } };
        }),

        axios.get(`${API_BASE_URL}/admin/slots`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Slots API error:', err.message);
          return { data: { data: [] } };
        }),

        // ✅ Services API fetch
        axios.get(`${API_BASE_URL}/admin/services`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Services API error:', err.message);
          return { data: { data: [] } };
        }),

        // ✅ Service Orders API fetch
        axios.get(`${API_BASE_URL}/admin/service-orders?per_page=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Service Orders API error:', err.message);
          return { data: { data: [] } };
        })
      ]);

      // Handle API responses properly
      const parkings = extractData(parkingsRes.data);
      const bookings = extractData(bookingsRes.data);
      const users = extractData(usersRes.data);
      const slots = extractData(slotsRes.data);
      const services = extractData(servicesRes.data); // ✅ Services data
      const serviceOrders = extractData(serviceOrdersRes.data); // ✅ Service Orders data

      console.log('📊 PROCESSED DATA:');
      console.log('Parkings:', parkings.length);
      console.log('Bookings:', bookings.length);
      console.log('Services:', services.length);
      console.log('Service Orders:', serviceOrders.length);

      // ✅ FIXED: Calculate slots statistics from slots table
      const totalSlots = slots.length;
      const availableSlots = slots.filter(slot => slot.available === true || slot.available === 1).length;

      // Calculate parking revenue and statistics
      const totalParkingRevenue = bookings
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);

      // Calculate service revenue and statistics
      const totalServiceRevenue = serviceOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.service?.price || 0), 0);

      const totalCombinedRevenue = totalParkingRevenue + totalServiceRevenue;

      // Calculate parking booking statistics
      const activeParkingBookings = bookings.filter(booking => 
        booking.status === 'confirmed' || booking.status === 'active'
      ).length;

      const completedParkingBookings = bookings.filter(booking => 
        booking.status === 'completed'
      ).length;

      const pendingParkingBookings = bookings.filter(booking => 
        booking.status === 'pending'
      ).length;

      const cancelledParkingBookings = bookings.filter(booking => 
        booking.status === 'cancelled'
      ).length;

      // Calculate service order statistics
      const completedServiceOrders = serviceOrders.filter(order => 
        order.status === 'completed'
      ).length;

      const pendingServiceOrders = serviceOrders.filter(order => 
        order.status === 'pending'
      ).length;

      const inProgressServiceOrders = serviceOrders.filter(order => 
        order.status === 'in_progress'
      ).length;

      const cancelledServiceOrders = serviceOrders.filter(order => 
        order.status === 'cancelled'
      ).length;

      const totalServiceOrdersCount = serviceOrders.length;

      // Active services count
      const activeServices = services.filter(service => 
        service.status === 'active' || service.is_active === true || service.is_active === 1
      ).length;

      // Calculate revenue with date filters
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Parking revenue by time
      const todayParkingRevenue = bookings
        .filter(booking => 
          booking.status === 'completed' && 
          booking.created_at && 
          booking.created_at.includes(today)
        )
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);

      const monthlyParkingRevenue = bookings
        .filter(booking => {
          if (booking.status !== 'completed' || !booking.created_at) return false;
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);

      const yearlyParkingRevenue = bookings
        .filter(booking => {
          if (booking.status !== 'completed' || !booking.created_at) return false;
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);

      // Service revenue by time
      const todayServiceRevenue = serviceOrders
        .filter(order => 
          order.status === 'completed' && 
          order.created_at && 
          order.created_at.includes(today)
        )
        .reduce((sum, order) => sum + parseFloat(order.service?.price || 0), 0);

      const monthlyServiceRevenue = serviceOrders
        .filter(order => {
          if (order.status !== 'completed' || !order.created_at) return false;
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + parseFloat(order.service?.price || 0), 0);

      // Recent bookings
      const recentBookingsData = [...bookings]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5)
        .map(booking => ({
          ...booking,
          user: booking.user || { name: 'N/A' },
          parking: booking.parking || { name: 'N/A' },
          slot: booking.slot || { slot_code: 'N/A' },
          type: 'parking' // Type identifier
        }));

      // Recent service orders
      const recentServiceOrdersData = [...serviceOrders]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5)
        .map(order => ({
          ...order,
          user: order.user || { name: 'N/A' },
          service: order.service || { name: 'N/A', price: 0 },
          type: 'service' // Type identifier
        }));

      // Set stats
      const newStats = {
        // Parking Stats
        totalParkings: parkings.length,
        totalSlots,
        availableSlots,
        activeBookings: activeParkingBookings,
        totalUsers: users.length,
        todayRevenue: todayParkingRevenue,
        monthlyRevenue: monthlyParkingRevenue,
        totalRevenue: totalParkingRevenue,
        yearlyRevenue: yearlyParkingRevenue,
        completedBookings: completedParkingBookings,
        pendingBookings: pendingParkingBookings,
        cancelledBookings: cancelledParkingBookings,
        
        // Service Stats
        totalServices: services.length,
        activeServices,
        totalServiceOrders: totalServiceOrdersCount,
        completedServiceOrders,
        pendingServiceOrders,
        inProgressServiceOrders,
        cancelledServiceOrders,
        totalServiceRevenue,
        todayServiceRevenue,
        monthlyServiceRevenue,
        
        // Combined Stats
        totalCombinedRevenue,
        totalCombinedBookings: bookings.length + serviceOrders.length
      };

      console.log('FINAL STATS:', newStats);

      setStats(newStats);
      setRecentBookings(recentBookingsData);
      setRecentServiceOrders(recentServiceOrdersData);

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper function to extract data from different API response structures
  const extractData = (response) => {
    if (!response) return [];
    
    // Case 1: Direct array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Case 2: Paginated response { data: { data: [], ... } }
    else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Case 3: Nested structure
    else if (response.data && typeof response.data === 'object') {
      // Try to find array in nested structure
      for (let key in response.data) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }
    }
    // Case 4: Fallback
    return [];
  };

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

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-loading">
          <span />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

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
    { label: "Total Revenue", value: formatCurrency(stats.totalCombinedRevenue), note: "Parking + services", icon: RiWallet3Line },
    { label: "Total Bookings", value: stats.totalCombinedBookings, note: "All booking types", icon: RiCalendarCheckLine },
    { label: "Registered Users", value: stats.totalUsers, note: "Customer accounts", icon: RiUser3Line },
  ];

  const metricCards = [
    { label: "Parking Lots", value: stats.totalParkings, note: "Locations", icon: RiCarLine },
    { label: "Total Slots", value: stats.totalSlots, note: `${stats.availableSlots} available`, icon: RiFileList3Line },
    { label: "Active Parking", value: stats.activeBookings, note: "Running bookings", icon: RiTimeLine },
    { label: "Parking Revenue", value: formatCurrency(stats.totalRevenue), note: "Completed bookings", icon: RiWallet3Line },
    { label: "Service Orders", value: stats.totalServiceOrders, note: `${stats.inProgressServiceOrders} in progress`, icon: RiServiceLine },
    { label: "Service Revenue", value: formatCurrency(stats.totalServiceRevenue), note: "Completed services", icon: RiWallet3Line },
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
                <p>{item.note}</p>
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
              <p>{item.note}</p>
            </article>
          );
        })}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-dashboard-panel">
          <div className="admin-panel-head">
            <div>
              <span>Parking</span>
              <h3>Recent Parking Bookings</h3>
            </div>
            <Link to="/admin/bookings">
              View All
              <RiArrowRightLine />
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
              <span>Services</span>
              <h3>Recent Service Orders</h3>
            </div>
            <Link to="/admin/service-orders">
              View All
              <RiArrowRightLine />
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
            <span>Finance</span>
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
