import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDirections, FaParking, FaSearch } from "react-icons/fa";
import { RiCarLine, RiStarSFill, RiTimeLine } from "react-icons/ri";
import api, { APP_BASE_URL } from "../api/client";
import ServicePagination from "./ServicePagination";
import "../pages/Home.css";
import "./css/Services.css";
import "./css/AllParkings.css";

const BASE_URL = `${APP_BASE_URL}/`;
const PARKING_FALLBACKS = ["/images/parking-lot1.jpg", "/images/parking-lot2.jpg", "/images/parking-lot3.jpg"];

const getFallbackImage = (index = 0) => PARKING_FALLBACKS[index % PARKING_FALLBACKS.length];

const resolveImageUrl = (image, index = 0) => {
    if (!image || image === "null" || image === "undefined") return getFallbackImage(index);
    const imageValue = String(image).trim();
    if (/^https?:\/\//i.test(imageValue)) return imageValue;
    if (imageValue.startsWith("/images/")) return imageValue;
    if (imageValue.startsWith("images/") && !imageValue.startsWith("images/parkings/")) return `/${imageValue}`;
    return `${BASE_URL}${imageValue.replace(/^\/+/, "")}`;
};

const handleParkingImageError = (event, index = 0) => {
    const fallback = getFallbackImage(index);
    if (event.currentTarget.src.endsWith(fallback)) return;
    event.currentTarget.src = fallback;
};

const normalizeParkingResponse = (responseData, perPage) => {
    const parkingData = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

    const paginationData = {
        current_page: responseData?.current_page || 1,
        last_page: responseData?.last_page || 1,
        per_page: responseData?.per_page || perPage,
        total: responseData?.total || parkingData.length,
    };

    return { parkingData, paginationData };
};

const getCurrentLocation = () =>
    new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }
        );
    });

const formatParkingDistance = (spot) => {
    const distance = Number(spot.calculated_distance);
    if (!Number.isNaN(distance) && distance >= 0) {
        return distance < 1 ? `${Math.round(distance * 1000)} m from you` : `${distance.toFixed(1)} km from you`;
    }

    return spot.distance ? `${spot.distance} from city center` : "Premium Location";
};

export default function AllParkings() {
    const [parkingSpots, setParkingSpots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [userLocation, setUserLocation] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 9,
        total: 0,
    });
    const navigate = useNavigate();

    useEffect(() => {
        getCurrentLocation().then(setUserLocation);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 450);

        return () => window.clearTimeout(timer);
    }, [searchTerm]);

    const fetchParkings = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/parkings", {
                params: {
                    page,
                    per_page: pagination.per_page,
                    q: debouncedSearch || undefined,
                    latitude: userLocation?.latitude,
                    longitude: userLocation?.longitude,
                },
            });

            const { parkingData, paginationData } = normalizeParkingResponse(response.data, pagination.per_page);
            setParkingSpots(parkingData);
            setPagination(paginationData);
        } catch (fetchError) {
            console.error("Error fetching parkings:", fetchError);
            setError("Failed to load parking locations. Please try again later.");
            setParkingSpots([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, page, pagination.per_page, userLocation]);

    useEffect(() => {
        fetchParkings();
    }, [fetchParkings]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(1);
    };

    const parkingPath = (spot) => `/parking/${spot.slug || spot.id}`;

    const handleParkingSpotClick = (spot) => {
        navigate(parkingPath(spot));
    };

    const openParkingMap = (spot) => {
        const hasCoordinates = spot.latitude && spot.longitude;
        const destination = hasCoordinates
            ? `${spot.latitude},${spot.longitude}`
            : encodeURIComponent(`${spot.name} ${spot.address || spot.distance || ""} parking`);
        const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

        window.open(mapUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <main className="parkings-page">
            <div className="parkings-shell">
                <div className="parkings-page-head">
                    <div className="">
                        <h1 className="services-title">Parking Locations</h1>
                    </div>
                </div>

                <div className="services-toolbar parkings-toolbar">
                    <label className="services-search" htmlFor="parkingSearch">
                        <FaSearch />
                        <input
                            id="parkingSearch"
                            type="search"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search parking, distance, price, or features"
                        />
                    </label>
                </div>

                {error && (
                    <div className="services-alert services-alert-error">
                        {error}
                        <button onClick={fetchParkings} className="services-retry-btn">Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="centers-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading parking locations...</p>
                    </div>
                ) : (
                    <div className="parkings-grid">
                        {parkingSpots.map((spot, index) => (
                            <div key={spot.id} className="parking-grid-item">
                                <div
                                    className="home-parking-card h-100"
                                    onClick={() => handleParkingSpotClick(spot)}
                                >
                                    <div className="home-card-image">
                                        <img
                                            src={resolveImageUrl(spot.image, index)}
                                            className="home-card-img"
                                            alt={spot.name}
                                            loading="lazy"
                                            onError={(event) => handleParkingImageError(event, index)}
                                        />
                                        <div className="home-card-image-shade"></div>
                                        <div className="home-card-badge">
                                            <span className={`home-availability-badge ${spot.available_slots > 0 ? "available" : "full"}`}>
                                                {spot.available_slots > 0 ? `${spot.available_slots} Available` : "Fully Booked"}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="home-distance-badge home-distance-link"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openParkingMap(spot);
                                            }}
                                        >
                                            <FaDirections className="me-1" />
                                            {formatParkingDistance(spot)}
                                        </button>
                                    </div>

                                    <div className="home-card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="home-card-title mb-0">{spot.name}</h5>
                                            <div className="home-rating">
                                                <RiStarSFill className="home-rating-star" />
                                                <span className="ms-1">4.8</span>
                                            </div>
                                        </div>

                                        <div className="home-card-meta">
                                            <div className="home-meta-item">
                                                <RiCarLine className="me-2" />
                                                <span>{spot.total_slots} Slots</span>
                                            </div>
                                            <div className="home-meta-item">
                                                <RiTimeLine className="me-2" />
                                                <span>24/7 Access</span>
                                            </div>
                                        </div>

                                        <div className="home-card-footer">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="home-price-info">
                                                    <div className="home-price-amount">BDT {spot.price_per_hour}/hr</div>
                                                </div>
                                                <button
                                                    className={`${spot.available_slots > 0 ? "home-btn-neon-primary" : "home-btn-neon-secondary"}`}
                                                    disabled={spot.available_slots === 0}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleParkingSpotClick(spot);
                                                    }}
                                                >
                                                    {spot.available_slots > 0 ? "Book Now" : "Fully Booked"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {parkingSpots.length === 0 && !loading && (
                    <div className="py-16 text-center">
                        <div className="parkings-empty-card">
                            <FaParking />
                            <h2>No Parking Spots Available</h2>
                            <p>Try a different search keyword.</p>
                        </div>
                    </div>
                )}

                <ServicePagination
                    pagination={pagination}
                    loading={loading}
                    onPageChange={setPage}
                />
            </div>
        </main>
    );
}
