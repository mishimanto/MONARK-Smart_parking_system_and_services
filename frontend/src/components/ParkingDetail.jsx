import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { APP_BASE_URL, bookingAPI, walletAPI } from "../api/client";
import { AuthContext } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import {
    RiArrowLeftLine,
    RiCarLine,
    RiCheckboxCircleLine,
    RiMapPinLine,
    RiParkingBoxLine,
    RiSecurePaymentLine,
    RiTimerFlashLine,
    RiWallet3Line,
} from "react-icons/ri";
import { FaCalendarCheck } from "react-icons/fa";
import "./css/ParkingDetail.css";

const BASE_URL = APP_BASE_URL;
const PARKING_FALLBACKS = [
    "/images/parking-lot1.jpg",
    "/images/parking-lot2.jpg",
    "/images/parking-lot3.jpg",
    "/images/default-parking.jpg",
];

const resolveParkingImage = (image, index = 0) => {
    const fallback = PARKING_FALLBACKS[index % PARKING_FALLBACKS.length];
    if (!image || image === "null") {
        return fallback;
    }

    const trimmedImage = String(image).trim();
    if (!trimmedImage) {
        return fallback;
    }

    if (trimmedImage.startsWith("http") || trimmedImage.startsWith("/images/")) {
        return trimmedImage;
    }

    const cleanPath = trimmedImage.replace(/^\/+/, "");
    return `${BASE_URL}/${cleanPath}`;
};

const handleParkingImageError = (event) => {
    const currentFallback = Number(event.currentTarget.dataset.fallbackIndex || 0);
    const nextFallback = currentFallback + 1;

    if (nextFallback < PARKING_FALLBACKS.length) {
        event.currentTarget.dataset.fallbackIndex = nextFallback;
        event.currentTarget.src = PARKING_FALLBACKS[nextFallback];
        return;
    }

    event.currentTarget.onerror = null;
};

const isSlotAvailable = (slot) => (
    slot.available === true ||
    slot.available === 1 ||
    slot.available === "1" ||
    slot.available === "true"
);

export default function ParkingDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [parking, setParking] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingHours, setBookingHours] = useState(1);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const parkingRes = await api.get(`/parkings/${slug}`);
                const parkingData = parkingRes.data;

                if (parkingData.slug && parkingData.slug !== slug) {
                    navigate(`/parking/${parkingData.slug}`, { replace: true });
                }

                const processedParking = {
                    ...parkingData,
                    image: resolveParkingImage(parkingData.image),
                };

                setParking(processedParking);

                if (user?.role === "user") {
                    try {
                        const walletRes = await walletAPI.getBalance();

                        if (walletRes && walletRes.data && typeof walletRes.data.balance !== "undefined") {
                            setWalletBalance(walletRes.data.balance);
                        } else if (walletRes && typeof walletRes.balance !== "undefined") {
                            setWalletBalance(walletRes.balance);
                        } else {
                            console.warn("Wallet API returned unexpected response:", walletRes);
                            setWalletBalance(0);
                        }
                    } catch (walletError) {
                        console.warn("Wallet balance unavailable:", walletError.response?.data || walletError.message);
                        setWalletBalance(0);
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchData();
    }, [navigate, slug, user?.role]);

    const handleBookNow = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            Swal.fire({
                icon: "warning",
                title: "Login Required",
                text: "Please login first to book a parking spot!",
                confirmButtonText: "OK",
            }).then(() => navigate("/login"));
            return;
        }

        if (user?.role !== "user") {
            showErrorToast("Customer account required", "Only customer accounts can book parking.");
            return;
        }

        if (!selectedSlot) {
            Swal.fire({
                icon: "info",
                title: "Select Slot",
                text: "Please select a parking slot first!",
                confirmButtonText: "OK",
            });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                parking_id: Number(parking.id),
                slot_id: Number(selectedSlot.id),
                hours: Number(bookingHours),
            };

            await bookingAPI.createWithWallet(payload);

            const newBalanceRes = await walletAPI.getBalance();
            const refreshedBalance = newBalanceRes.data?.balance || 0;
            setWalletBalance(refreshedBalance);

            showSuccessToast(
                "Booking Successful",
                `${parking.name} - Slot ${selectedSlot.slot_code}. Paid BDT ${(bookingHours * parking.price_per_hour).toFixed(2)}.`
            );
            navigate("/dashboard");

        } catch (err) {
            console.error("Booking error:", err.response?.data || err.message);

            let errorMessage = "Something went wrong. Please try again.";

            if (err.response?.status === 422) {
                if (err.response.data?.errors) {
                    errorMessage = Object.values(err.response.data.errors)
                        .flat()
                        .join("\n");
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                }
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            showErrorToast("Booking Failed", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!parking) {
        return (
            <main className="parking-detail-page">
                <div className="parking-detail-shell">
                    <div className="parking-detail-empty">Loading parking details...</div>
                </div>
            </main>
        );
    }

    const slots = Array.isArray(parking.slots) ? parking.slots : [];
    const availableSlots = Number(parking.available_slots || slots.filter((slot) => isSlotAvailable(slot)).length || 0);
    const totalSlots = Number(parking.total_slots || slots.length || 0);
    const pricePerHour = Number(parking.price_per_hour || 0);
    const totalAmount = bookingHours * pricePerHour;
    const hasLowBalance = walletBalance > 0 && walletBalance < totalAmount;

    return (
        <main className="parking-detail-page">
            <div className="parking-detail-shell">
                <div className="parking-detail-topbar">
                    <button
                        type="button"
                        className="parking-detail-back"
                        onClick={() => navigate("/")}
                    >
                        <RiArrowLeftLine />
                        Back to Home
                    </button>
                </div>

                <section className="parking-detail-hero">
                    <div className="parking-detail-media">
                        <img
                            src={parking.image}
                            alt={parking.name}
                            onError={handleParkingImageError}
                        />
                        <div className="parking-detail-media-shade" />
                        <span className={`parking-detail-status ${availableSlots > 0 ? "is-open" : "is-full"}`}>
                            {availableSlots > 0 ? `${availableSlots} Slots Available` : "Fully Booked"}
                        </span>
                    </div>

                    <div className="parking-detail-info">
                        <div className="parking-detail-title-row">
                            <h1>{parking.name}</h1>
                            <p>{parking.description || "Reserve a reliable parking slot with wallet payment and instant confirmation."}</p>
                        </div>

                        <div className="parking-detail-meta">
                            <div className="parking-detail-meta-item">
                                <RiMapPinLine />
                                <span>{parking.location || parking.address || parking.distance || "Central parking zone"}</span>
                            </div>
                            <div className="parking-detail-meta-item">
                                <RiSecurePaymentLine />
                                <span>Wallet secured booking</span>
                            </div>
                        </div>

                        <div className="parking-detail-stats">
                            <div className="parking-stat-card">
                                <RiCarLine />
                                <span>Total Slots</span>
                                <strong>{totalSlots}</strong>
                            </div>
                            <div className="parking-stat-card is-accent">
                                <RiCheckboxCircleLine />
                                <span>Available</span>
                                <strong>{availableSlots}</strong>
                            </div>
                            <div className="parking-stat-card">
                                <RiTimerFlashLine />
                                <span>Hourly Rate</span>
                                <strong>BDT {pricePerHour}</strong>
                            </div>
                        </div>

                        <div className="parking-wallet-card">

                            <div>
                                <span>Your Wallet Balance</span>
                                <strong>BDT {walletBalance}</strong>
                                {hasLowBalance && <p>Balance is lower than selected booking total.</p>}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="parking-booking-grid">
                    <div className="parking-slots-panel">
                        <div className="parking-section-head">
                            <h2>Available Parking Slots</h2>
                        </div>
                        <div className="parking-slots-grid">
                            {slots.length > 0 ? (
                                <>
                                    {slots.map((slot) => {
                                        const isSelected = selectedSlot?.id === slot.id;
                                        const isAvailable = isSlotAvailable(slot);

                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                className={`parking-slot-card ${isSelected ? "is-selected" : ""} ${!isAvailable ? "is-disabled" : ""}`}
                                                onClick={() => isAvailable && setSelectedSlot(slot)}
                                                disabled={!isAvailable}
                                            >
                                                <RiParkingBoxLine />
                                                <strong>{slot.slot_code}</strong>
                                                <span>{slot.type || "Standard"}</span>
                                                <small>
                                                    {isAvailable ? "Available" : "Booked"}
                                                </small>
                                            </button>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="parking-empty-state">
                                    <RiParkingBoxLine />
                                    <h3>No parking slots available</h3>
                                    <p>Slots will appear here when this parking area is ready for booking.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="parking-booking-panel">
                        <div className="parking-booking-head">
                            <h2>Confirm Your Slot</h2>
                        </div>

                        {selectedSlot ? (
                            <>
                                <div className="parking-selected-slot">
                                    <span>Selected Slot</span>
                                    <strong>{selectedSlot.slot_code}</strong>
                                    <p>{selectedSlot.type || "Standard"} parking slot</p>
                                </div>

                                <label className="parking-form-label" htmlFor="booking-hours">
                                    Booking Duration
                                </label>
                                <select
                                    id="booking-hours"
                                    className="parking-duration-select"
                                    value={bookingHours}
                                    onChange={(event) => setBookingHours(parseInt(event.target.value, 10))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                                        <option key={hour} value={hour}>
                                            {hour} hour{hour > 1 ? "s" : ""}
                                        </option>
                                    ))}
                                </select>

                                <div className="parking-price-summary">
                                    <div>
                                        <span>Price/hour</span>
                                        <strong>BDT {pricePerHour.toFixed(2)}</strong>
                                    </div>
                                    <div>
                                        <span>Duration</span>
                                        <strong>{bookingHours} hour{bookingHours > 1 ? "s" : ""}</strong>
                                    </div>
                                    <div>
                                        <span>Total Amount</span>
                                        <b className="text-xl text-red-600">BDT {totalAmount.toFixed(2)}</b>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="parking-confirm-btn"
                                    onClick={handleBookNow}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <RiTimerFlashLine className="is-spinning" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCalendarCheck />
                                            Confirm Booking
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="parking-booking-empty">
                                <RiParkingBoxLine />
                                <h3>Choose a slot first</h3>
                                <p>Select an available slot from the grid to see your booking summary.</p>
                            </div>
                        )}
                    </aside>
                </section>
            </div>
        </main>
    );
}
