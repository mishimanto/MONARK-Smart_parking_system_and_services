import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  RiArrowRightLine,
  RiCalendarCheckLine,
  RiCloseCircleLine,
  RiFileList3Line,
  RiLogoutBoxRLine,
  RiParkingBoxLine,
  RiSecurePaymentLine,
  RiTimeLine,
} from "react-icons/ri";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import Swal from "sweetalert2";
import { AuthContext } from "../contexts/AuthContext";
import api, { bookingAPI, getStoredToken, serviceOrdersAPI, walletAPI } from "../api/client";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import "./css/Dashboard.css";

const ACTIVE_PARKING_STATUSES = ["confirmed", "active", "checkout_requested", "checkout_paid"];
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
  const { user } = useContext(AuthContext);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("parking");
  const [actionLoading, setActionLoading] = useState(null);

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
        const token = getStoredToken();

        if (!user && !token) {
          navigate("/login");
          return;
        }

        await Promise.all([fetchWalletData(), fetchUserBookings(), fetchServiceOrders()]);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate, user]);

  const parkingActive = useMemo(
    () => bookings.filter((booking) => ACTIVE_PARKING_STATUSES.includes(booking.status)),
    [bookings]
  );

  const serviceActive = useMemo(
    () => serviceOrders.filter((order) => ACTIVE_SERVICE_STATUSES.includes(order.status)),
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

  const stats = activeSection === "parking"
    ? [
        { label: "Total Parking Bookings", value: bookings.length, icon: RiCalendarCheckLine },
        { label: "Active Parking Bookings", value: parkingActive.length, icon: RiParkingBoxLine },
        { label: "Total Spent", value: formatMoney(totalParkingSpent), icon: FaBangladeshiTakaSign },
      ]
    : [
        { label: "Total Services Bookings", value: serviceOrders.length, icon: HiWrenchScrewdriver },
        { label: "Active Services Bookings", value: serviceActive.length, icon: RiTimeLine },
        { label: "Total Spent", value: formatMoney(totalServiceSpent), icon: FaBangladeshiTakaSign },
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
        showSuccessToast("Checkout requested", "Checkout requested successfully!");

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
      showErrorToast("Checkout request failed", error.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayExtraCharges = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const response = await bookingAPI.payExtraCharges(bookingId);

      if (response.data.success) {
        showSuccessToast("Payment successful", "Extra charges paid successfully! Waiting for admin approval.");

        await fetchUserBookings();
        await fetchWalletData();
      }
    } catch (error) {
      showErrorToast("Payment failed", error.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelServiceOrder = async (orderId) => {
    const result = await Swal.fire({
      title: "Cancel this service?",
      text: "The paid amount will be refunded to your wallet if the order has not started.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel",
      cancelButtonText: "Keep booking",
      confirmButtonColor: "#00b8c4",
    });

    if (!result.isConfirmed) return;

    setActionLoading(orderId);
    try {
      const response = await serviceOrdersAPI.cancelOrder(orderId, "Cancelled from dashboard");
      showSuccessToast("Service cancelled", `Refunded ${formatMoney(response.data?.refund_amount || 0)} to your wallet.`);
      await Promise.all([fetchServiceOrders(), fetchWalletData()]);
    } catch (error) {
      showErrorToast("Cancel failed", error.response?.data?.message || "Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const activeList = activeSection === "parking" ? parkingActive : serviceActive;

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <h1>Hello, {user.name}</h1>
            <p>Manage your parking bookings, car service orders, wallet balance.</p>
            <div className="dashboard-quick-actions">
              <button type="button" onClick={() => navigate("/dashboard/parking-history")}>
                <RiFileList3Line />
                Parking History
              </button>
              <button type="button" onClick={() => navigate("/dashboard/service-history")}>
                <RiFileList3Line />
                Service History
              </button>
            </div>
          </div>

          <div className="dashboard-wallet">
            <div>
              <span>Wallet Balance</span>
              <strong>{formatMoney(walletBalance)}</strong>
            </div>
            <button type="button" onClick={() => navigate("/topup")}>
              <FaBangladeshiTakaSign />
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
            <HiWrenchScrewdriver />
            Car Services
            {serviceActive.length > 0 && <span>{serviceActive.length}</span>}
          </button>
        </section>

        <section className="dashboard-stats-grid">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="dashboard-stat-card">
                <div className="dashboard-stat-copy">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="dashboard-stat-icon">
                  <Icon />
                </div>
              </article>
            );
          })}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
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
                        <div className="dashboard-card-icon"><HiWrenchScrewdriver /></div>
                        <div>
                          <h3>{order.service?.name || "Car Service"}</h3>
                          <p>{order.service?.duration || "Service duration"} • {formatDate(order.booking_time)}</p>
                        </div>
                      </div>
                      <div className="dashboard-card-meta">
                        <span>{formatMoney(order.service?.price)}</span>
                        <small>{normalizeStatus(order.status)}</small>
                      </div>
                      {["pending", "confirmed"].includes(order.status) && (
                        <div className="dashboard-card-actions">
                          <button
                            type="button"
                            onClick={() => handleCancelServiceOrder(order.id)}
                            disabled={actionLoading === order.id}
                          >
                            <RiCloseCircleLine />
                            Cancel
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              {activeSection === "parking" ? <RiParkingBoxLine /> : <HiWrenchScrewdriver />}
              <h3>{activeSection === "parking" ? "No active parking bookings" : "No active car services"}</h3>
              <p>{activeSection === "parking" ? "Book a nearby parking spot to see live booking details here." : "Book a car service and track the active order here."}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
