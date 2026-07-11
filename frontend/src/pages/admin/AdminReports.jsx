import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  RiCalendarCheckLine,
  RiDownloadLine,
  RiFileChartLine,
  RiInboxLine,
  RiParkingBoxLine,
  RiPrinterLine,
  RiRefreshLine,
  RiTimeLine,
  RiUser3Line,
  RiWallet3Line,
} from "react-icons/ri";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { API_BASE_URL } from "../../api/client";
import AdminFilterBar from "./components/AdminFilterBar";
import "./css/ParkingAdmin.css";
import "./css/ServiceAdmin.css";
import "./css/ReportsAdmin.css";

export default function AdminReports({ reportType = "parking" }) {
  const [parkingBookings, setParkingBookings] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [filteredParkingBookings, setFilteredParkingBookings] = useState([]);
  const [filteredServiceBookings, setFilteredServiceBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const activeTab = reportType === "services" ? "services" : "parking";
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [summary, setSummary] = useState({
    totalParkingBookings: 0,
    totalServiceBookings: 0,
    totalParkingRevenue: 0,
    totalServiceRevenue: 0,
    completedParkingBookings: 0,
    completedServiceBookings: 0,
    pendingParkingBookings: 0,
    pendingServiceBookings: 0,
  });

  const calculateSummary = useCallback((parkingData, serviceData) => {
    const totalParkingRevenue = parkingData
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    const totalServiceRevenue = serviceData
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + Number(booking.service?.price || 0), 0);

    setSummary({
      totalParkingBookings: parkingData.length,
      totalServiceBookings: serviceData.length,
      totalParkingRevenue,
      totalServiceRevenue,
      completedParkingBookings: parkingData.filter((booking) => booking.status === "completed").length,
      completedServiceBookings: serviceData.filter((booking) => booking.status === "completed").length,
      pendingParkingBookings: parkingData.filter((booking) => booking.status === "pending").length,
      pendingServiceBookings: serviceData.filter((booking) => booking.status === "pending").length,
    });
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formatInputDate = (date) => date.toISOString().split("T")[0];
      const today = new Date();
      let dateFrom = dateRange.start;
      let dateTo = dateRange.end;

      if (!dateFrom && !dateTo && timeRange !== "all") {
        if (timeRange === "today") {
          dateFrom = formatInputDate(today);
          dateTo = formatInputDate(today);
        }
        if (timeRange === "weekly") {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFrom = formatInputDate(weekAgo);
          dateTo = formatInputDate(today);
        }
        if (timeRange === "monthly") {
          dateFrom = formatInputDate(new Date(today.getFullYear(), today.getMonth(), 1));
          dateTo = formatInputDate(today);
        }
        if (timeRange === "yearly") {
          dateFrom = formatInputDate(new Date(today.getFullYear(), 0, 1));
          dateTo = formatInputDate(today);
        }
      }

      const params = {
        per_page: 1000,
        q: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      const request =
        activeTab === "parking"
          ? axios.get(`${API_BASE_URL}/admin/bookings`, {
              headers: { Authorization: `Bearer ${token}` },
              params,
            })
          : axios.get(`${API_BASE_URL}/admin/service-orders`, {
              headers: { Authorization: `Bearer ${token}` },
              params,
            });

      const response = await request;
      const data = response.data.success ? (response.data.data.data || []) : [];

      if (activeTab === "parking") {
        setParkingBookings(data);
        setFilteredParkingBookings(data);
        setServiceBookings([]);
        setFilteredServiceBookings([]);
        calculateSummary(data, []);
      } else {
        setParkingBookings([]);
        setFilteredParkingBookings([]);
        setServiceBookings(data);
        setFilteredServiceBookings(data);
        calculateSummary([], data);
      }
    } catch (error) {
      console.error("Error fetching bookings data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, calculateSummary, dateRange.end, dateRange.start, searchTerm, statusFilter, timeRange]);

  const applyFilters = useCallback(() => {
    let filteredParking = [...parkingBookings];
    let filteredService = [...serviceBookings];

    if (searchTerm) {
      const needle = searchTerm.toLowerCase();
      filteredParking = filteredParking.filter((booking) =>
        booking.user?.name?.toLowerCase().includes(needle) ||
        booking.user?.email?.toLowerCase().includes(needle) ||
        booking.parking?.name?.toLowerCase().includes(needle) ||
        booking.slot?.slot_code?.toLowerCase().includes(needle) ||
        String(booking.id).includes(searchTerm)
      );
      filteredService = filteredService.filter((booking) =>
        booking.user?.name?.toLowerCase().includes(needle) ||
        booking.user?.email?.toLowerCase().includes(needle) ||
        booking.service?.name?.toLowerCase().includes(needle) ||
        String(booking.id).includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filteredParking = filteredParking.filter((booking) => booking.status === statusFilter);
      filteredService = filteredService.filter((booking) => booking.status === statusFilter);
    }

    if (dateRange.start) {
      filteredParking = filteredParking.filter((booking) => new Date(booking.created_at) >= new Date(dateRange.start));
      filteredService = filteredService.filter((booking) => new Date(booking.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filteredParking = filteredParking.filter((booking) => new Date(booking.created_at) <= new Date(`${dateRange.end}T23:59:59`));
      filteredService = filteredService.filter((booking) => new Date(booking.created_at) <= new Date(`${dateRange.end}T23:59:59`));
    }

    const now = new Date();
    if (timeRange === "today") {
      filteredParking = filteredParking.filter((booking) => new Date(booking.created_at).toDateString() === now.toDateString());
      filteredService = filteredService.filter((booking) => new Date(booking.created_at).toDateString() === now.toDateString());
    }
    if (timeRange === "weekly") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredParking = filteredParking.filter((booking) => new Date(booking.created_at) >= weekAgo);
      filteredService = filteredService.filter((booking) => new Date(booking.created_at) >= weekAgo);
    }
    if (timeRange === "monthly") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredParking = filteredParking.filter((booking) => new Date(booking.created_at) >= monthStart);
      filteredService = filteredService.filter((booking) => new Date(booking.created_at) >= monthStart);
    }
    if (timeRange === "yearly") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filteredParking = filteredParking.filter((booking) => new Date(booking.created_at) >= yearStart);
      filteredService = filteredService.filter((booking) => new Date(booking.created_at) >= yearStart);
    }

    setFilteredParkingBookings(filteredParking);
    setFilteredServiceBookings(filteredService);
  }, [dateRange, parkingBookings, searchTerm, serviceBookings, statusFilter, timeRange]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleReset = () => {
    setSearchTerm("");
    setTimeRange("all");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
  };

  const getCurrentBookings = () => (activeTab === "parking" ? filteredParkingBookings : filteredServiceBookings);
  const getTotalBookings = () => (activeTab === "parking" ? parkingBookings.length : serviceBookings.length);

  const getFilteredRevenue = () => {
    if (activeTab === "parking") {
      return filteredParkingBookings
        .filter((booking) => booking.status === "completed")
        .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    }
    return filteredServiceBookings
      .filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + Number(booking.service?.price || 0), 0);
  };

  const getStatusClass = (status) => {
    if (["completed", "confirmed"].includes(status)) return "is-completed";
    if (status === "pending") return "is-pending";
    if (status === "cancelled") return "is-danger";
    if (status === "active" || status === "in_progress") return "is-confirmed";
    return "is-soft";
  };

  const formatStatus = (status) =>
    String(status || "N/A").split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  const exportToCSV = () => {
    const escapeCsv = (value) => {
      const text = value === null || value === undefined ? "N/A" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = [];

    if (activeTab === "parking") {
      rows.push(["Booking ID", "User Name", "User Email", "Parking Name", "Slot Code", "Hours", "Amount", "Status", "Booking Date"]);
      filteredParkingBookings.forEach((booking) => {
        rows.push([
          booking.id,
          booking.user?.name,
          booking.user?.email,
          booking.parking?.name,
          booking.slot?.slot_code,
          booking.hours,
          booking.total_price,
          booking.status,
          booking.created_at,
        ]);
      });
    } else {
      rows.push(["Order ID", "User Name", "User Email", "Service Name", "Service Price", "Booking Time", "Status", "Order Date"]);
      filteredServiceBookings.forEach((booking) => {
        rows.push([
          booking.id,
          booking.user?.name,
          booking.user?.email,
          booking.service?.name,
          booking.service?.price,
          booking.booking_time,
          booking.status,
          booking.created_at,
        ]);
      });
    }

    const csvContent = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const encodedUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}-bookings-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printContent = document.getElementById(`${activeTab}-bookings-table`);
    const printWindow = window.open("", "_blank");
    if (!printContent || !printWindow) return;

    const statusText = statusFilter === "all" ? "All Status" : formatStatus(statusFilter);
    const currentBookings = getCurrentBookings();
    printWindow.document.write(`
      <html>
        <head>
          <title>${activeTab === "parking" ? "Parking" : "Service"} Bookings Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #dbeafe; padding: 8px; text-align: left; }
            th { background-color: #0f172a; color: #d8f7ff; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #00b8c4; padding-bottom: 10px; }
            .filters { margin-bottom: 15px; padding: 10px; background: #ecfeff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${activeTab === "parking" ? "Parking" : "Service"} Bookings Report</h2>
            <p><strong>Generated:</strong> ${new Date().toLocaleString("en-BD")}</p>
          </div>
          <div class="filters">
            <div><strong>Status:</strong> ${statusText}</div>
            ${searchTerm ? `<div><strong>Search:</strong> "${searchTerm}"</div>` : ""}
            <div><strong>Bookings:</strong> ${currentBookings.length} of ${getTotalBookings()}</div>
            <div><strong>Revenue:</strong> ${formatCurrency(getFilteredRevenue())}</div>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const hasFilters = Boolean(searchTerm || timeRange !== "all" || statusFilter !== "all" || dateRange.start || dateRange.end);
  const reportTitle = activeTab === "parking" ? "Parking Booking Reports" : "Service Booking Reports";
  const reportLabel = activeTab === "parking" ? "parking" : "service";
  const currentSummary = activeTab === "parking"
    ? {
        total: summary.totalParkingBookings,
        completed: summary.completedParkingBookings,
        pending: summary.pendingParkingBookings,
        revenue: summary.totalParkingRevenue,
        icon: <RiParkingBoxLine />,
        noun: "Parking Bookings",
      }
    : {
        total: summary.totalServiceBookings,
        completed: summary.completedServiceBookings,
        pending: summary.pendingServiceBookings,
        revenue: summary.totalServiceRevenue,
        icon: <HiWrenchScrewdriver />,
        noun: "Service Bookings",
      };
  const statCards = [
    { label: "Total Revenue", value: formatCurrency(currentSummary.revenue), note: `${reportLabel} completed revenue`, icon: <FaBangladeshiTakaSign /> },
    { label: currentSummary.noun, value: currentSummary.total, note: `All ${reportLabel} records`, icon: currentSummary.icon },
    { label: "Completed", value: currentSummary.completed, note: `Completed ${reportLabel} bookings`, icon: <RiCalendarCheckLine /> },
    { label: "Pending", value: currentSummary.pending, note: `Pending ${reportLabel} bookings`, icon: <RiTimeLine /> },
  ];

  return (
    <section className="parking-admin-page service-admin-page reports-admin-page">
      <div className="parking-admin-hero">
        <div>
          <h1>{reportTitle}</h1>
        </div>
        <div className="parking-admin-actions">
          <button className="pa-btn pa-btn-ghost" type="button" onClick={fetchBookings} disabled={loading}>
            <RiRefreshLine /> {loading ? "Refreshing" : "Refresh"}
          </button>
          <button className="pa-btn pa-btn-ghost" type="button" onClick={exportToCSV} disabled={getCurrentBookings().length === 0}>
            <RiDownloadLine /> Export
          </button>
          <button className="pa-btn pa-btn-primary" type="button" onClick={handlePrint} disabled={getCurrentBookings().length === 0}>
            <RiPrinterLine /> Print
          </button>
        </div>
      </div>

      <div className="reports-stat-grid">
        {statCards.map((card) => (
          <article className="pa-stat-card" key={card.label}>
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
            {card.icon}
          </article>
        ))}
      </div>

      <AdminFilterBar
        searchValue={searchTerm}
        searchPlaceholder="Search bookings, user, parking, service, or ID"
        onSearchChange={setSearchTerm}
        filters={[
          {
            id: "time",
            label: "Time Range",
            value: timeRange,
            clearValue: "all",
            isActive: (value) => value !== "all",
            onChange: setTimeRange,
            options: [
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "weekly", label: "Last 7 Days" },
              { value: "monthly", label: "This Month" },
              { value: "yearly", label: "This Year" },
            ],
          },
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            clearValue: "all",
            isActive: (value) => value !== "all",
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
              ...(activeTab === "services" ? [{ value: "in_progress", label: "In Progress" }] : []),
            ],
          },
          {
            id: "start",
            label: "Start Date",
            type: "date",
            value: dateRange.start,
            onChange: (value) => setDateRange((prev) => ({ ...prev, start: value })),
          },
          {
            id: "end",
            label: "End Date",
            type: "date",
            value: dateRange.end,
            onChange: (value) => setDateRange((prev) => ({ ...prev, end: value })),
          },
        ]}
      />

      <div className="pa-panel">
        {loading ? (
          <div className="pa-empty-state">Loading booking reports...</div>
        ) : getCurrentBookings().length === 0 ? (
          <div className="pa-empty-state">
            <RiInboxLine />
            <h3>No {reportLabel} bookings found</h3>
            <p>{hasFilters ? "No bookings match your filter criteria." : "There are no bookings in this report yet."}</p>
            {hasFilters && (
              <button className="pa-btn pa-btn-primary" type="button" onClick={handleReset}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="pa-table-wrap" id={`${activeTab}-bookings-table`}>
            <table className="pa-table reports-table">
              <thead>
                {activeTab === "parking" ? (
                  <tr>
                    <th>Booking</th>
                    <th>User</th>
                    <th>Parking</th>
                    <th>Slot</th>
                    <th>Duration</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Booking Date</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Order</th>
                    <th>User</th>
                    <th>Service</th>
                    <th>Booking Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Order Date</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {getCurrentBookings().map((booking) => (
                  <tr key={booking.id}>
                    {activeTab === "parking" ? (
                      <>
                        <td><strong>#{booking.id}</strong></td>
                        <td className="reports-user-cell">
                          <span className="pa-icon-text"><RiUser3Line /> {booking.user?.name || "N/A"}</span>
                          <span className="pa-cell-note">{booking.user?.email || "N/A"}</span>
                        </td>
                        <td className="text-center"><span className="pa-icon-text"><RiParkingBoxLine /> {booking.parking?.name || "N/A"}</span></td>
                        <td className="text-center"><span className="pa-slot-code">{booking.slot?.slot_code || "N/A"}</span></td>
                        <td className="text-center"><span className="pa-icon-text"><RiTimeLine /> {booking.hours} hour{booking.hours > 1 ? "s" : ""}</span></td>
                        <td className="pa-price">
                          <span className="pa-price-value">{formatCurrency(booking.total_price)}</span>
                        </td>
                        <td className="text-center"><span className={`pa-status ${getStatusClass(booking.status)}`}>{formatStatus(booking.status)}</span></td>
                        <td className="text-center"><span className="pa-icon-text"><RiCalendarCheckLine /> {formatDate(booking.created_at)}</span></td>
                      </>
                    ) : (
                      <>
                        <td><strong>#{booking.id}</strong></td>
                        <td className="reports-user-cell">
                          <span className="pa-icon-text"><RiUser3Line /> {booking.user?.name || "N/A"}</span>
                          <span className="pa-cell-note">{booking.user?.email || "N/A"}</span>
                        </td>
                        <td className="reports-user-cell text-center">
                          <span className="pa-icon-text"><HiWrenchScrewdriver /> {booking.service?.name || "N/A"}</span>
                          <span className="pa-cell-note">{booking.service?.description || ""}</span>
                        </td>
                        <td className="text-center"><span className="pa-icon-text"><RiCalendarCheckLine /> {formatDate(booking.booking_time)}</span></td>
                        <td className="pa-price">
                          <span className="pa-price-value">{formatCurrency(booking.service?.price || 0)}</span>
                        </td>
                        <td className="text-center"><span className={`pa-status ${getStatusClass(booking.status)}`}>{formatStatus(booking.status)}</span></td>
                        <td className="text-center"><span className="pa-icon-text"><RiFileChartLine /> {formatDate(booking.created_at)}</span></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
