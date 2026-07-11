import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  RiArrowLeftLine,
  RiCalendarCheckLine,
  RiCheckboxCircleLine,
  RiMapPin2Line,
  RiSecurePaymentLine,
  RiServiceLine,
  RiStarSFill,
  RiTimeLine,
  RiWallet3Line,
} from "react-icons/ri";
import { FaCalendarAlt } from "react-icons/fa";
import api, { APP_BASE_URL, walletAPI } from "../api/client";
import { AuthContext } from "../contexts/AuthContext";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import "./css/ServiceDetail.css";

const SERVICE_FALLBACKS = ["/images/parking-hero-3.jpg", "/images/parking-hero-2.jpg", "/images/parking-hero.png"];

const resolveServiceImage = (image, index = 0) => {
  const fallback = SERVICE_FALLBACKS[index % SERVICE_FALLBACKS.length];
  if (!image || image === "null" || image === "undefined") return fallback;

  const imageValue = String(image).trim();
  if (!imageValue) return fallback;
  if (/^https?:\/\//i.test(imageValue) || imageValue.startsWith("/images/")) return imageValue;

  return `${APP_BASE_URL}/${imageValue.replace(/^\/+/, "")}`;
};

const getDefaultBookingTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);

  return now
    .toLocaleString("sv-SE", { timeZone: "Asia/Dhaka" })
    .replace(" ", "T")
    .slice(0, 16);
};

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [service, setService] = useState(null);
  const [bookingTime, setBookingTime] = useState(getDefaultBookingTime());
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [serviceRes] = await Promise.all([
          api.get(`/services/${id}`),
        ]);

        setService(serviceRes.data);

        if (user?.role === "user") {
          try {
            const walletRes = await walletAPI.getBalance();
            setWalletBalance(Number(walletRes?.data?.balance ?? walletRes?.balance ?? 0));
          } catch (walletError) {
            console.warn("Wallet balance unavailable:", walletError.response?.data || walletError.message);
            setWalletBalance(0);
          }
        }
      } catch (error) {
        console.error("Service detail fetch error:", error.response?.data || error.message);
        showErrorToast("Service not found", "This service is unavailable or inactive.");
        navigate("/services");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate, user?.role]);

  const descriptionItems = useMemo(() => {
    const description = service?.description || "Professional car care service with reliable booking and wallet-secured payment.";
    return description
      .split(".")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);
  }, [service]);

  const handleBooking = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      showErrorToast("Login required", "Please login first to book a service.");
      navigate("/login");
      return;
    }

    if (user?.role !== "user") {
      showErrorToast("Customer account required", "Only customer accounts can book services.");
      return;
    }

    if (!bookingTime) {
      showErrorToast("Select booking time", "Please choose a date and time.");
      return;
    }

    const servicePrice = Number(service.price || 0);
    if (walletBalance < servicePrice) {
      showErrorToast("Insufficient balance", "Please add money to your wallet before booking this service.");
      navigate("/topup");
      return;
    }

    setBookingLoading(true);
    try {
      await api.post("/service-orders", {
        service_id: Number(service.id),
        booking_time: bookingTime,
        notes: `Booking for ${service.name}`,
      });

      showSuccessToast("Booking Successful", `${service.name} has been booked successfully.`);
      navigate("/my-services");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Booking failed. Please try again.";

      if (errorMessage.toLowerCase().includes("insufficient")) {
        showErrorToast("Insufficient balance", "Please add money to your wallet before booking.");
        navigate("/topup");
      } else {
        showErrorToast("Booking Failed", errorMessage);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || !service) {
    return (
      <main className="service-detail-page">
        <div className="service-detail-shell">
          <div className="service-detail-empty">Loading service details...</div>
        </div>
      </main>
    );
  }

  const price = Number(service.price || 0);
  const hasLowBalance = walletBalance < price;
  const center = service.service_center;

  return (
    <main className="service-detail-page">
      <div className="service-detail-shell">
        <div className="service-detail-topbar">
          <button type="button" className="service-detail-back" onClick={() => navigate("/services")}>
            <RiArrowLeftLine />
            Back to Services
          </button>
        </div>

        <section className="service-detail-hero">
          <div className="service-detail-media">
            <img
              src={resolveServiceImage(service.image)}
              alt={service.name}
              onError={(event) => {
                event.currentTarget.src = SERVICE_FALLBACKS[0];
              }}
            />
            <div className="service-detail-media-shade" />
            <span className="service-detail-price">BDT {price.toFixed(2)}</span>
          </div>

          <div className="service-detail-info">
            <div className="service-detail-title-row">
              <div className="service-detail-heading">
                <h1>{service.name}</h1>
                <div className="service-detail-rating">
                  <RiStarSFill />
                  <span>4.5</span>
                </div>
              </div>
              <p>{service.description || "Book premium car care with wallet-secured confirmation."}</p>
            </div>

            <div className="service-detail-meta">
              <div className="service-detail-meta-item">
                <RiTimeLine />
                <span>{service.duration || "Flexible timing"}</span>
              </div>
              <div className="service-detail-meta-item">
                <RiSecurePaymentLine />
                <span>Wallet secured booking</span>
              </div>
              <div className="service-detail-meta-item">
                <RiMapPin2Line />
                <span>{center?.name || center?.address || "Nearest service center assigned after booking"}</span>
              </div>
            </div>

            <div className="service-detail-stats">
              <div className="service-stat-card is-accent">
                <RiServiceLine />
                <span>Service Price</span>
                <strong>BDT {price.toFixed(2)}</strong>
              </div>
              <div className="service-stat-card">
                <RiCalendarCheckLine />
                <span>Status</span>
                <strong>{service.status || "active"}</strong>
              </div>
              <div className="service-stat-card">
                <RiCheckboxCircleLine />
                <span>Service Type</span>
                <strong>{service.type || "Car Care"}</strong>
              </div>
            </div>

            <div className="service-wallet-card">
              <div>
                <span>Your Wallet Balance</span>
                <strong>BDT {walletBalance.toFixed(2)}</strong>
                {hasLowBalance && <p>Balance is lower than the selected service price.</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="service-booking-grid">
          <div className="service-details-panel">
            <div className="service-section-head">
              <h2>Service Details</h2>
            </div>
            <div className="service-benefit-grid">
              {descriptionItems.map((item) => (
                <div className="service-benefit-card" key={item}>
                  <RiCheckboxCircleLine />
                  <span>{item}.</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="service-booking-panel">
            <div className="service-booking-head">
              <h2>Confirm Booking</h2>
            </div>

            <label className="service-form-label" htmlFor="bookingTime">
              <FaCalendarAlt />
              Booking Date & Time
            </label>
            <input
              type="datetime-local"
              id="bookingTime"
              value={bookingTime}
              onChange={(event) => setBookingTime(event.target.value)}
              min={new Date().toLocaleString("sv-SE", { timeZone: "Asia/Dhaka" }).replace(" ", "T").slice(0, 16)}
              className="service-time-input"
            />

            <div className="service-price-summary">
              <div>
                <span>Service</span>
                <strong>{service.name}</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>{service.duration || "Flexible"}</strong>
              </div>
              <div>
                <span>Total Amount</span>
                <b>BDT {price.toFixed(2)}</b>
              </div>
            </div>

            <button type="button" className="service-confirm-btn" onClick={handleBooking} disabled={bookingLoading}>
              {bookingLoading ? (
                <>
                  <RiTimeLine className="is-spinning" />
                  Processing...
                </>
              ) : (
                <>
                  <FaCalendarAlt />
                  Confirm Booking
                </>
              )}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}
