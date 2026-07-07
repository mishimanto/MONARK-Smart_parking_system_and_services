import React, { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaCar,
    FaCheckCircle,
    FaClock,
    FaLocationArrow,
    FaMapMarkerAlt,
    FaParking,
    FaRedo,
    FaStar,
} from "react-icons/fa";
import api, { APP_BASE_URL } from "../api/client";
import "./css/AllParkings.css";

const BASE_URL = `${APP_BASE_URL}/`;
const PARKING_FALLBACKS = ["/images/parking-lot1.jpg", "/images/parking-lot2.jpg", "/images/parking-lot3.jpg"];

const getFallbackImage = (index = 0) => PARKING_FALLBACKS[index % PARKING_FALLBACKS.length];

const resolveImageUrl = (image, index = 0) => {
    if (!image || image === "null" || image === "undefined") return getFallbackImage(index);
    const imageValue = String(image).trim();
    if (/^https?:\/\//i.test(imageValue)) return imageValue;
    if (imageValue.startsWith("/images/")) return imageValue;
    return `${BASE_URL}${imageValue.replace(/^\/+/, "")}`;
};

const handleParkingImageError = (event, index = 0) => {
    const fallback = getFallbackImage(index);
    if (event.currentTarget.src.endsWith(fallback)) return;
    event.currentTarget.src = fallback;
};

export default function AllParkings() {
    const [parkingSpots, setParkingSpots] = useState([]);
    const [filteredParkings, setFilteredParkings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState(null);
    const [userArea, setUserArea] = useState(null);
    const [areaNames, setAreaNames] = useState({});
    const navigate = useNavigate();

    // Get user's current location with better error handling
    const getUserLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ latitude, longitude });
                },
                (error) => {
                    let errorMessage = "Unable to get your location";
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Location access denied. Please enable location services.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location information unavailable.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Location request timed out.";
                            break;
                        default:
                            errorMessage = "An unknown error occurred.";
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }, []);

    // Get area name from coordinates (Reverse Geocoding) with rate limiting
    const getAreaFromCoordinates = useCallback(async (lat, lng, delay = 0) => {
        try {
            // Add delay to avoid rate limiting
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
            );
            
            if (!response.ok) {
                throw new Error('Geocoding failed');
            }
            
            const data = await response.json();
            
            // Extract area name from address
            const address = data.address;
            let areaName = '';
            
            if (address.suburb) {
                areaName = address.suburb;
            } else if (address.neighbourhood) {
                areaName = address.neighbourhood;
            } else if (address.road) {
                areaName = `${address.road} Area`;
            } else if (address.city_district) {
                areaName = address.city_district;
            } else if (address.city) {
                areaName = address.city;
            } else {
                areaName = 'Dhaka Area';
            }
            
            return areaName;
        } catch (error) {
            console.error('Error getting area name:', error);
            return 'Dhaka Area';
        }
    }, []);

    // Get area names for all parkings sequentially to avoid rate limiting
    const getAllParkingAreaNames = useCallback(async (parkings) => {
        const areaNamesMap = {};
        
        for (let i = 0; i < parkings.length; i++) {
            const parking = parkings[i];
            
            if (parking.latitude && parking.longitude) {
                try {
                    // Add 1 second delay between API calls
                    const delay = i * 1000;
                    const areaName = await getAreaFromCoordinates(
                        parking.latitude,
                        parking.longitude,
                        delay
                    );
                    areaNamesMap[parking.id] = areaName;
                } catch (error) {
                    console.error(`Error getting area for parking ${parking.id}:`, error);
                    areaNamesMap[parking.id] = 'Dhaka Area';
                }
            } else {
                // Fallback if no coordinates
                areaNamesMap[parking.id] = 'Dhaka Area';
            }
        }
        
        return areaNamesMap;
    }, [getAreaFromCoordinates]);

    // Estimate distance from text description (fallback)
    const estimateDistanceFromText = useCallback((distanceText) => {
        if (!distanceText) return 10; // Default far distance
        
        const match = distanceText.match(/(\d+(?:\.\d+)?)\s*(km|m)/i);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            
            if (unit === 'km') return value;
            if (unit === 'm') return value / 1000;
        }
        
        // Extract number from text like "2 km from city center"
        const numberMatch = distanceText.match(/(\d+(?:\.\d+)?)/);
        if (numberMatch) {
            return parseFloat(numberMatch[1]);
        }
        
        return 10; // Default far distance
    }, []);

    // Haversine formula to calculate distance between two coordinates
    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance;
    }, []);

    // Sort parkings by distance from user
    const sortParkingsByDistance = useCallback((parkings, userLoc) => {
        return parkings
            .map(parking => {
                let distanceKm;
                
                if (parking.latitude && parking.longitude) {
                    // Calculate actual distance using coordinates
                    distanceKm = calculateDistance(
                        userLoc.latitude,
                        userLoc.longitude,
                        parking.latitude,
                        parking.longitude
                    );
                } else {
                    // Fallback: estimate from distance field (e.g., "2 km from city center")
                    distanceKm = estimateDistanceFromText(parking.distance);
                }
                
                return {
                    ...parking,
                    calculatedDistance: distanceKm
                };
            })
            .sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    }, [calculateDistance, estimateDistanceFromText]);

    // Fetch user location and parkings
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setLocationLoading(true);

            try {
                let detectedLocation = null;

                // Try to get user location
                try {
                    const location = await getUserLocation();
                    detectedLocation = location;
                    setUserLocation(location);
                    setLocationError(null);
                    
                    // Get user's area name
                    const area = await getAreaFromCoordinates(location.latitude, location.longitude);
                    setUserArea(area);
                } catch (error) {
                    console.log("Location access not available:", error.message);
                    setLocationError(error.message);
                }

                // Fetch parkings
                const response = await api.get("/parkings");
                const parkingsData = response.data;
                
                // Process parkings data to ensure coordinates are numbers
                const processedParkings = parkingsData.map(parking => ({
                    ...parking,
                    latitude: parking.latitude ? parseFloat(parking.latitude) : null,
                    longitude: parking.longitude ? parseFloat(parking.longitude) : null
                }));
                
                setParkingSpots(processedParkings);
                
                // Get area names for all parkings in background
                getAllParkingAreaNames(processedParkings)
                    .then(areaNamesMap => {
                        setAreaNames(areaNamesMap);
                    })
                    .catch(error => {
                        console.error("Error fetching area names:", error);
                    });
                
                // If we have user location, sort parkings by distance
                if (detectedLocation) {
                    const sortedParkings = sortParkingsByDistance(processedParkings, detectedLocation);
                    setFilteredParkings(sortedParkings);
                } else {
                    setFilteredParkings(processedParkings);
                }
                
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
                setLocationLoading(false);
            }
        };

        fetchData();
    }, [getAllParkingAreaNames, getAreaFromCoordinates, getUserLocation, sortParkingsByDistance]);

    // Update filtered parkings when userLocation changes
    useEffect(() => {
        if (userLocation && parkingSpots.length > 0) {
            const sortedParkings = sortParkingsByDistance(parkingSpots, userLocation);
            setFilteredParkings(sortedParkings);
        }
    }, [parkingSpots, sortParkingsByDistance, userLocation]);

    // Get display distance text - exactly like distance-badge
    const getDistanceText = (parking) => {
        if (!userLocation || !parking.calculatedDistance) {
            return parking.distance || 'Nearby';
        }
        
        const distance = parking.calculatedDistance;
        
        if (distance < 0.1) {
            return `${Math.round(distance * 1000)} m away`;
        } else if (distance < 1) {
            return `${Math.round(distance * 1000)} m away`;
        } else {
            return `${distance.toFixed(1)} km away`;
        }
    };

    // Get area name for display
    const getAreaName = (parking) => {
        return areaNames[parking.id] || "Loading...";
    };

    // Retry location access
    const retryLocation = async () => {
        setLocationLoading(true);
        setLocationError(null);
        
        try {
            const location = await getUserLocation();
            setUserLocation(location);
            
            // Get user's area name
            const area = await getAreaFromCoordinates(location.latitude, location.longitude);
            setUserArea(area);
        } catch (error) {
            setLocationError(error.message);
        } finally {
            setLocationLoading(false);
        }
    };

    const handleParkingSpotClick = (spotId) => {
        navigate(`/parking/${spotId}`);
    };

    const parseParkingFeatures = (description) => {
        if (!description) return [];
        return description.split('•').map(item => item.trim()).filter(item => item);
    };

    const displayParkings = filteredParkings.length > 0 ? filteredParkings : parkingSpots;

    return (
        <main className="parkings-page">
            <div className="parkings-shell">
                <div className="parkings-page-head">
                    <div>
                        <button
                            type="button"
                            className="parkings-back-btn"
                            onClick={() => navigate("/")}
                        >
                            <FaArrowLeft />
                            Back to Home
                        </button>
                        <h1 className="parkings-title">
                            {userLocation ? "Parkings Near You" : "All Parking Locations"}
                        </h1>
                        <p className="parkings-subtitle">
                            {userLocation && userArea ? (
                                <>Showing available parking near <strong>{userArea}</strong>, sorted by distance.</>
                            ) : userLocation ? (
                                "Parking locations are sorted by distance from your current position."
                            ) : (
                                "Browse secure parking locations, compare slots, and book the right spot faster."
                            )}
                        </p>
                    </div>

                    <div className="parkings-summary-panel">
                        <div>
                            <span>{displayParkings.length}</span>
                            <p>Locations</p>
                        </div>
                        <div>
                            <span>{displayParkings.reduce((total, spot) => total + Number(spot.available_slots || 0), 0)}</span>
                            <p>Available Slots</p>
                        </div>
                    </div>
                </div>

                {locationError && (
                    <div className="parkings-alert parkings-alert-warning">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <FaLocationArrow className="mt-1 shrink-0" />
                                <span>{locationError}</span>
                            </div>
                            <button
                                type="button"
                                className="parkings-small-btn"
                                onClick={retryLocation}
                                disabled={locationLoading}
                            >
                                {locationLoading ? (
                                    <>
                                        <span className="size-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                                        Detecting...
                                    </>
                                ) : (
                                    <>
                                        <FaRedo className="text-xs" />
                                        Retry
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {userLocation && !locationError && (
                    <div className="parkings-alert parkings-alert-success">
                        <div className="inline-flex items-center gap-2">
                            <FaCheckCircle />
                            <span>
                                {userArea ? (
                                    <>Showing parkings near <strong>{userArea}</strong></>
                                ) : (
                                    <>Showing parkings near your location</>
                                )}
                            </span>
                        </div>
                    </div>
                )}

                <div className="parkings-grid">
                    {displayParkings.map((spot, index) => {
                        const features = parseParkingFeatures(spot.description).slice(0, 3);
                        const isNearby = userLocation && index < 3;

                        return (
                            <article
                                key={spot.id}
                                className="parking-list-card"
                                onClick={() => handleParkingSpotClick(spot.id)}
                            >
                                <div className="parking-card-media">
                                    <img
                                        src={resolveImageUrl(spot.image, index)}
                                        alt={spot.name}
                                        onError={(event) => handleParkingImageError(event, index)}
                                        className="parking-card-img"
                                    />
                                    <div className="parking-card-shade" />
                                    {isNearby && (
                                        <div className="parking-nearest-badge">
                                            <FaLocationArrow />
                                            {index === 0 ? 'Nearest' : index === 1 ? '2nd Nearest' : '3rd Nearest'}
                                        </div>
                                    )}
                                    <span
                                        className={[
                                            "parking-slot-badge",
                                            spot.available_slots > 0 ? "is-available" : "is-full",
                                        ].join(" ")}
                                    >
                                        {spot.available_slots > 0 ? `${spot.available_slots} Slots` : 'Fully Booked'}
                                    </span>
                                    <div className="parking-distance-badge">
                                        <FaMapMarkerAlt />
                                        {getDistanceText(spot)}
                                    </div>
                                </div>

                                <div className="parking-card-content">
                                    <div className="parking-card-heading">
                                        <h2 className="parking-card-title">{spot.name}</h2>
                                        <div className="parking-rating">
                                            <FaStar />
                                            <span>4.5</span>
                                        </div>
                                    </div>

                                    <div className="parking-area-chip">
                                        <FaMapMarkerAlt />
                                        <span>{getAreaName(spot)}</span>
                                    </div>

                                    <div className="parking-feature-list">
                                        {features.length > 0 ? (
                                            features.map((feature, featureIndex) => (
                                                <div key={featureIndex} className="flex items-start gap-2">
                                                    <FaCheckCircle />
                                                    <span>{feature}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p>Secure parking with convenient access.</p>
                                        )}
                                    </div>

                                    <div className="parking-meta-list">
                                        <div>
                                            <FaCar />
                                            <span>Total: {spot.total_slots} slots</span>
                                        </div>
                                        <div>
                                            <FaClock />
                                            <span>24/7 Access</span>
                                        </div>
                                    </div>

                                    <div className="parking-card-footer">
                                        <div className="parking-card-footer-row">
                                            <div>
                                                <div className="parking-price">BDT {spot.price_per_hour}/hr</div>
                                                <div className="parking-price-note">Incl. all taxes</div>
                                            </div>
                                            <button
                                                type="button"
                                                className={[
                                                    "parking-book-btn",
                                                    spot.available_slots > 0 ? "" : "is-disabled",
                                                ].join(" ")}
                                                disabled={spot.available_slots === 0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleParkingSpotClick(spot.id);
                                                }}
                                            >
                                                {spot.available_slots > 0 ? 'Book Now' : 'Fully Booked'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {displayParkings.length === 0 && !loading && (
                    <div className="py-16 text-center">
                        <div className="parkings-empty-card">
                            <FaParking />
                            <h2>No Parking Spots Available</h2>
                            <p>Check back later for new locations</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
