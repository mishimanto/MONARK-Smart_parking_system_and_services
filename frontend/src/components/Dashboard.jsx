import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiArrowRightLine,
  RiCalendarCheckLine,
  RiCarLine,
  RiDownload2Line,
  RiFileList3Line,
  RiHistoryLine,
  RiLogoutBoxRLine,
  RiParkingBoxLine,
  RiSecurePaymentLine,
  RiServiceLine,
  RiTicket2Line,
  RiTimeLine,
  RiWallet3Line,
} from "react-icons/ri";
import Swal from "sweetalert2";
import { AuthContext } from "../contexts/AuthContext";
import api, { bookingAPI, getMe, serviceOrdersAPI, walletAPI } from "../api/client";
import Spinner from "../components/Spinner";
import "./css/Dashboard.css";

const ACTIVE_PARKING_STATUSES = ["confirmed", "active", "checkout_requested", "checkout_paid"];
const DONE_STATUSES = ["completed", "cancelled"];
const ACTIVE_SERVICE_STATUSES = ["pending", "confirmed", "in_progress"];

const formatDate = (dateString) => {
  if (!dateString) return "Not available";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (amount) => `BDT ${Number.parseFloat(amount || 0).toFixed(2)}`;

const normalizeStatus = (status = "") => status.replaceAll("_", " ");

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("parking");
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchWalletData = async () => {
    try {
      const balanceData = await walletAPI.getBalance();
      setWalletBalance(balanceData?.success ? balanceData.balance : 0);
    } catch (error) {
      console.error("Wallet fetch error:", error);
      setWalletBalance(0);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const response = await api.get("/bookings");
      setBookings(response.data?.success ? response.data.bookings || [] : []);
    } catch (error) {
      console.error("Bookings fetch error:", error);
      setBookings([]);
    }
  };

  const fetchServiceOrders = async () => {
    try {
      const response = await serviceOrdersAPI.getUserOrders();
      setServiceOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Service orders fetch error:", error);
      setServiceOrders([]);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);

      try {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        let currentUser = null;

        if (savedUser) {
          try {
            currentUser = JSON.parse(savedUser);
            setUser(currentUser);
          } catch {
            localStorage.removeItem("user");
          }
        }

        if (!currentUser && !token) {
          navigate("/login");
          return;
        }

        if (token) {
          const userData = await getMe();
          if (!userData?.user) {
            navigate("/login");
            return;
          }

          setUser(userData.user);
          localStorage.setItem("user", JSON.stringify(userData.user));
        }

        await Promise.all([fetchWalletData(), fetchUserBookings(), fetchServiceOrders()]);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate, setUser]);

  const parkingActive = useMemo(
    () => bookings.filter((booking) => ACTIVE_PARKING_STATUSES.includes(booking.status)),
    [bookings]
  );

  const parkingHistory = useMemo(
    () => bookings.filter((booking) => DONE_STATUSES.includes(booking.status)),
    [bookings]
  );

  const serviceActive = useMemo(
    () => serviceOrders.filter((order) => ACTIVE_SERVICE_STATUSES.includes(order.status)),
    [serviceOrders]
  );

  const serviceHistory = useMemo(
    () => serviceOrders.filter((order) => DONE_STATUSES.includes(order.status)),
    [serviceOrders]
  );

  const totalParkingSpent = useMemo(
    () => bookings.reduce((sum, booking) => sum + Number.parseFloat(booking.grand_total || booking.total_price || 0), 0),
    [bookings]
  );

  const totalServiceSpent = useMemo(
    () => serviceOrders.reduce((sum, order) => sum + Number.parseFloat(order.service?.price || 0), 0),
    [serviceOrders]
  );

  const recentActivity = useMemo(() => {
    const parkingItems = bookings.map((booking) => ({
      id: `parking-${booking.id}`,
      kind: "Parking",
      title: booking.parking?.name || "Parking booking",
      meta: `Slot ${booking.slot?.slot_code || "N/A"} • ${booking.hours || 0} hour${booking.hours > 1 ? "s" : ""}`,
      amount: booking.grand_total || booking.total_price,
      status: booking.status,
      created_at: booking.created_at,
    }));

    const serviceItems = serviceOrders.map((order) => ({
      id: `service-${order.id}`,
      kind: "Service",
      title: order.service?.name || "Car service",
      meta: order.service?.duration || formatDate(order.booking_time),
      amount: order.service?.price,
      status: order.status,
      created_at: order.created_at,
    }));

    return [...parkingItems, ...serviceItems]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);
  }, [bookings, serviceOrders]);

  const stats = activeSection === "parking"
    ? [
        { label: "Total Bookings", value: bookings.length, icon: RiCalendarCheckLine },
        { label: "Active Bookings", value: parkingActive.length, icon: RiParkingBoxLine },
        { label: "Parking Spent", value: formatMoney(totalParkingSpent), icon: RiSecurePaymentLine },
      ]
    : [
        { label: "Total Services", value: serviceOrders.length, icon: RiServiceLine },
        { label: "Active Services", value: serviceActive.length, icon: RiTimeLine },
        { label: "Service Spent", value: formatMoney(totalServiceSpent), icon: RiSecurePaymentLine },
      ];

  const handleCheckoutRequest = async (bookingId) => {
    const result = await Swal.fire({
      title: "Request Checkout?",
      text: "Are you sure you want to checkout from this parking spot?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Checkout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#00f7ff",
      cancelButtonColor: "#ff4d7d",
    });

    if (!result.isConfirmed) return;

    setActionLoading(bookingId);
    try {
      const response = await bookingAPI.requestCheckout(bookingId);

      if (response.data.success) {
        await Swal.fire({
          title: "Success!",
          text: "Checkout requested successfully!",
          icon: "success",
          confirmButtonColor: "#00f7ff",
        });

        if (response.data.requires_payment && response.data.extra_charges > 0) {
          const paymentResult = await Swal.fire({
            title: "Extra Charges Required",
            text: `You have extra charges of BDT ${response.data.extra_charges}. Do you want to pay now?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Pay Now",
            cancelButtonText: "Later",
            confirmButtonColor: "#00f7ff",
            cancelButtonColor: "#ff4d7d",
          });

          if (paymentResult.isConfirmed) {
            await handlePayExtraCharges(bookingId);
          }
        } else {
          await fetchUserBookings();
        }
      }
    } catch (error) {
      Swal.fire({
        title: "Failed!",
        text: error.response?.data?.message || "Checkout request failed. Please try again.",
        icon: "error",
        confirmButtonColor: "#ff4d7d",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayExtraCharges = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const response = await bookingAPI.payExtraCharges(bookingId);

      if (response.data.success) {
        await Swal.fire({
          title: "Success!",
          text: "Extra charges paid successfully! Waiting for admin approval.",
          icon: "success",
          confirmButtonColor: "#00f7ff",
        });

        await fetchUserBookings();
        await fetchWalletData();
      }
    } catch (error) {
      Swal.fire({
        title: "Failed!",
        text: error.response?.data?.message || "Payment failed. Please try again.",
        icon: "error",
        confirmButtonColor: "#ff4d7d",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadTicket = async (booking) => {
    try {
      setActionLoading(booking.id);
      const response = await bookingAPI.downloadTicket(booking.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${booking.ticket_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        title: "Success!",
        text: "Ticket downloaded successfully!",
        icon: "success",
        confirmButtonColor: "#00f7ff",
      });
    } catch (error) {
      const errorMessage = error.response?.status === 404
        ? "Ticket not found or not available for download"
        : "Failed to download ticket";

      Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#ff4d7d",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user) {
    return <Spinner />;
  }

  const activeList = activeSection === "parking" ? parkingActive : serviceActive;
  const historyList = activeSection === "parking" ? parkingHistory : serviceHistory;

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="dashboard-kicker">Customer Dashboard</span>
            <h1>Hello, {user.name}</h1>
            <p>Manage your parking bookings, car service orders, wallet balance, and completed tickets from one clean workspace.</p>
            <div className="dashboard-quick-actions">
              <button type="button" onClick={() => navigate("/all-parkings")}>
                <RiParkingBoxLine />
                Book Parking
              </button>
              <button type="button" onClick={() => navigate("/services")}>
                <RiCarLine />
                Book Service
              </button>
            </div>
          </div>

          <div className="dashboard-wallet">
            <div>
              <span>Wallet Balance</span>
              <strong>{formatMoney(walletBalance)}</strong>
            </div>
            <button type="button" onClick={() => navigate("/topup")}>
              <RiWallet3Line />
              Top Up
            </button>
          </div>
        </section>

        <section className="dashboard-switcher" aria-label="Dashboard section">
          <button
            type="button"
            className={activeSection === "parking" ? "is-active" : ""}
            onClick={() => setActiveSection("parking")}
          >
            <RiParkingBoxLine />
            Parking
            {parkingActive.length > 0 && <span>{parkingActive.length}</span>}
          </button>
          <button
            type="button"
            className={activeSection === "service" ? "is-active" : ""}
            onClick={() => setActiveSection("service")}
          >
            <RiServiceLine />
            Car Services
            {serviceActive.length > 0 && <span>{serviceActive.length}</span>}
          </button>
        </section>

        <section className="dashboard-stats-grid">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="dashboard-stat-card">
                <Icon />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            );
          })}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <span>{activeSection === "parking" ? "Active Parking" : "Active Services"}</span>
              <h2>{activeSection === "parking" ? "Current Parking Bookings" : "Current Car Services"}</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(activeSection === "parking" ? "/all-parkings" : "/services")}
            >
              New Booking
              <RiArrowRightLine />
            </button>
          </div>

          {activeList.length > 0 ? (
            <div className="dashboard-card-list">
              {activeSection === "parking"
                ? activeList.map((booking) => (
                    <article key={booking.id} className="dashboard-booking-card">
                      <div className="dashboard-card-main">
                        <div className="dashboard-card-icon"><RiParkingBoxLine /></div>
                        <div>
                          <h3>{booking.parking?.name || "Parking Location"}</h3>
                          <p>Slot {booking.slot?.slot_code || "N/A"} • {booking.hours || 0} hour{booking.hours > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="dashboard-card-meta">
                        <span>{formatMoney(booking.total_price || booking.grand_total)}</span>
                        <small>{booking.status === "checkout_requested" || booking.status === "checkout_paid" ? "Waiting approval" : normalizeStatus(booking.status)}</small>
                      </div>
                      <div className="dashboard-card-actions">
                        {booking.status === "confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleCheckoutRequest(booking.id)}
                            disabled={actionLoading === booking.id}
                          >
                            <RiLogoutBoxRLine />
                            Checkout
                          </button>
                        )}
                        {booking.status === "checkout_requested" && booking.extra_charges > 0 && (
                          <button
                            type="button"
                            onClick={() => handlePayExtraCharges(booking.id)}
                            disabled={actionLoading === booking.id}
                          >
                            <RiSecurePaymentLine />
                            Pay Extra
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                : activeList.map((order) => (
                    <article key={order.id} className="dashboard-booking-card">
                      <div className="dashboard-card-main">
                        <div className="dashboard-card-icon"><RiServiceLine /></div>
                        <div>
                          <h3>{order.service?.name || "Car Service"}</h3>
                          <p>{order.service?.duration || "Service duration"} • {formatDate(order.booking_time)}</p>
                        </div>
                      </div>
                      <div className="dashboard-card-meta">
                        <span>{formatMoney(order.service?.price)}</span>
                        <small>{normalizeStatus(order.status)}</small>
                      </div>
                    </article>
                  ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              {activeSection === "parking" ? <RiParkingBoxLine /> : <RiServiceLine />}
              <h3>{activeSection === "parking" ? "No active parking bookings" : "No active car services"}</h3>
              <p>{activeSection === "parking" ? "Book a nearby parking spot to see live booking details here." : "Book a car service and track the active order here."}</p>
            </div>
          )}
        </section>

        <section className="dashboard-tabs">
          <div className="dashboard-tab-buttons">
            <button type="button" className={activeTab === "overview" ? "is-active" : ""} onClick={() => setActiveTab("overview")}>
              <RiHistoryLine />
              Overview
            </button>
            <button type="button" className={activeTab === "history" ? "is-active" : ""} onClick={() => setActiveTab("history")}>
              <RiFileList3Line />
              History
            </button>
          </div>

          <div className="dashboard-tab-panel">
            {activeTab === "overview" && (
              <>
                <div className="dashboard-panel-title">
                  <span>Latest Activity</span>
                  <h2>Recent Bookings</h2>
                </div>
                {recentActivity.length > 0 ? (
                  <div className="dashboard-activity-list">
                    {recentActivity.map((item) => (
                      <article key={item.id} className="dashboard-activity-card">
                        <div>
                          <span>{item.kind}</span>
                          <h3>{item.title}</h3>
                          <p>{item.meta}</p>
                        </div>
                        <div>
                          <strong>{formatMoney(item.amount)}</strong>
                          <small>{normalizeStatus(item.status)}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty compact">
                    <RiCalendarCheckLine />
                    <h3>No bookings yet</h3>
                    <p>Start with your first parking booking or car service.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "history" && (
              <>
                <div className="dashboard-panel-title">
                  <span>Completed Records</span>
                  <h2>{activeSection === "parking" ? "Parking History" : "Service History"}</h2>
                </div>
                {historyList.length > 0 ? (
                  <div className="dashboard-history-list">
                    {activeSection === "parking"
                      ? historyList.map((booking) => (
                          <article key={booking.id} className="dashboard-history-card">
                            <div>
                              <span>Parking</span>
                              <h3>{booking.parking?.name || "Parking Location"}</h3>
                              <p>Slot {booking.slot?.slot_code || "N/A"} • {formatDate(booking.created_at)}</p>
                            </div>
                            <div>
                              <strong>{formatMoney(booking.grand_total || booking.total_price)}</strong>
                              <small>{normalizeStatus(booking.status)}</small>
                            </div>
                            {booking.ticket_number && (
                              <button type="button" onClick={() => setSelectedTicket(booking)}>
                                <RiTicket2Line />
                                View Ticket
                              </button>
                            )}
                          </article>
                        ))
                      : historyList.map((order) => (
                          <article key={order.id} className="dashboard-history-card">
                            <div>
                              <span>Service</span>
                              <h3>{order.service?.name || "Car Service"}</h3>
                              <p>{order.service?.duration || "Duration"} • {formatDate(order.booking_time)}</p>
                            </div>
                            <div>
                              <strong>{formatMoney(order.service?.price)}</strong>
                              <small>{normalizeStatus(order.status)}</small>
                            </div>
                          </article>
                        ))}
                  </div>
                ) : (
                  <div className="dashboard-empty compact">
                    <RiFileList3Line />
                    <h3>No history found</h3>
                    <p>Completed and cancelled records will appear here.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {selectedTicket && (
          <div className="dashboard-modal" role="dialog" aria-modal="true">
            <div className="dashboard-ticket">
              <div className="dashboard-ticket-head">
                <div>
                  <span>Parking Ticket</span>
                  <h2>{selectedTicket.ticket_number || "MONARK Ticket"}</h2>
                </div>
                <button type="button" onClick={() => setSelectedTicket(null)}>Close</button>
              </div>

              <div className="dashboard-ticket-grid">
                <div>
                  <span>User</span>
                  <strong>{user.name}</strong>
                </div>
                <div>
                  <span>Parking</span>
                  <strong>{selectedTicket.parking?.name || "Parking Location"}</strong>
                </div>
                <div>
                  <span>Slot</span>
                  <strong>{selectedTicket.slot?.slot_code || "N/A"}</strong>
                </div>
                <div>
                  <span>Duration</span>
                  <strong>{selectedTicket.hours} hour(s)</strong>
                </div>
                <div>
                  <span>Check-in</span>
                  <strong>{formatDate(selectedTicket.created_at)}</strong>
                </div>
                <div>
                  <span>Check-out</span>
                  <strong>{formatDate(selectedTicket.actual_end_time)}</strong>
                </div>
              </div>

              <div className="dashboard-ticket-total">
                <span>Total Amount</span>
                <strong>{formatMoney(Number.parseFloat(selectedTicket.total_price || 0) + Number.parseFloat(selectedTicket.extra_charges || 0))}</strong>
              </div>

              <button
                type="button"
                className="dashboard-download"
                onClick={() => handleDownloadTicket(selectedTicket)}
                disabled={actionLoading === selectedTicket.id}
              >
                <RiDownload2Line />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
