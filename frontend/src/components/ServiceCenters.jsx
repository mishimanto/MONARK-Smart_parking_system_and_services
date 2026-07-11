import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaClock, FaMapMarkerAlt, FaPhone, FaSearch, FaTimes } from "react-icons/fa";
import { API_BASE_URL } from "../api/client";
import ServicePagination from "./ServicePagination";
import "./css/Services.css";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const firstLat = Number(lat1);
  const firstLon = Number(lon1);
  const secondLat = Number(lat2);
  const secondLon = Number(lon2);

  if ([firstLat, firstLon, secondLat, secondLon].some(Number.isNaN)) {
    return null;
  }

  const radius = 6371;
  const dLat = ((secondLat - firstLat) * Math.PI) / 180;
  const dLon = ((secondLon - firstLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((firstLat * Math.PI) / 180) *
      Math.cos((secondLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (radius * c).toFixed(1);
};

const openGoogleMaps = (latitude, longitude) => {
  const url = `https://www.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=15`;
  window.open(url, "_blank");
};

const formatCenterDistance = (center, userLocation) => {
  const calculatedDistance = Number(center.calculated_distance);
  if (!Number.isNaN(calculatedDistance) && calculatedDistance >= 0) {
    return calculatedDistance < 1
      ? `${Math.round(calculatedDistance * 1000)} m away`
      : `${calculatedDistance.toFixed(1)} km away`;
  }

  if (!userLocation) return null;

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    center.latitude,
    center.longitude
  );

  return distance ? `${distance} km away` : null;
};

export default function ServiceCenters() {
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 8,
    total: 0,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }
    );
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const fetchServiceCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_BASE_URL}/service-centers`, {
        params: {
          page,
          per_page: pagination.per_page,
          q: debouncedSearch || undefined,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        },
      });

      let centersData = [];
      let paginationData = {
        current_page: 1,
        last_page: 1,
        per_page: pagination.per_page,
        total: 0,
      };

      if (Array.isArray(response.data)) {
        centersData = response.data;
      } else if (response.data.service_centers && Array.isArray(response.data.service_centers)) {
        centersData = response.data.service_centers;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        centersData = response.data.data;
      }

      if (response.data.pagination) {
        paginationData = response.data.pagination;
      } else if (response.data.current_page) {
        paginationData = {
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || pagination.per_page,
          total: response.data.total || centersData.length,
        };
      }

      setServiceCenters(centersData);
      setPagination(paginationData);
    } catch (err) {
      console.error("Error fetching service centers:", err);
      setError("Failed to load service centers. Please try again later.");
      setServiceCenters([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pagination.per_page, userLocation]);

  useEffect(() => {
    fetchServiceCenters();
  }, [fetchServiceCenters]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  return (
    <div className="services-container service-centers-page">
      <div className="services-header">
        <h1 className="services-title">Service Centers</h1>
      </div>

      <div className="services-toolbar">
        <label className="services-search" htmlFor="centerSearch">
          <FaSearch />
          <input
            id="centerSearch"
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search center, address, phone, or hours"
          />
        </label>

        <Link className="services-centers-link is-secondary" to="/services">
          <FaArrowLeft />
          Services
        </Link>
      </div>

      {error && (
        <div className="services-alert services-alert-error">
          {error}
          <button onClick={fetchServiceCenters} className="services-retry-btn">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="centers-loading">
          <div className="loading-spinner"></div>
          <p>Loading service centers...</p>
        </div>
      ) : (
        <div className="service-centers-list">
          {serviceCenters.length > 0 ? (
            serviceCenters.map((center, index) => {
              const centerDistance = formatCenterDistance(center, userLocation);

              return (
                <article
                  key={center.id}
                  className="service-center-item"
                  onClick={() => setSelectedCenter(center)}
                >
                  <div className="center-card-top">
                    <div className="center-card-heading">
                      <h3>{center.name}</h3>
                      <div className="center-card-badges">
                        {index === 0 && userLocation && (
                          <span className="nearest-tag">Nearest</span>
                        )}
                        {centerDistance && <span className="center-distance-tag">{centerDistance}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="center-card-details">
                    <div className="center-detail-row is-address">
                      <FaMapMarkerAlt />
                      <span>{center.address}</span>
                    </div>
                    <div className="center-detail-row">
                      <FaPhone />
                      <span>{center.phone}</span>
                    </div>
                    <div className="center-detail-row">
                      <FaClock />
                      <span>{center.opening_hours}</span>
                    </div>
                  </div>

                  <div className="center-card-actions">
                    <button
                      className="center-view-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedCenter(center);
                      }}
                    >
                      View Details
                    </button>
                    <button
                      className="center-map-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        openGoogleMaps(center.latitude, center.longitude);
                      }}
                    >
                      <FaMapMarkerAlt className="btn-icon" />
                      Map
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="services-empty service-centers-empty">
              <h3>No Service Centers Found</h3>
              <p>Try a different search keyword.</p>
            </div>
          )}
        </div>
      )}

      <ServicePagination
        pagination={pagination}
        loading={loading}
        onPageChange={setPage}
      />

      {selectedCenter && (
        <div
          className="service-center-overlay"
          onClick={() => setSelectedCenter(null)}
        >
          <div
            className="service-center-modal glass-effect animate-pop"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setSelectedCenter(null)}
              title="Close"
            >
              <FaTimes />
            </button>

            <div className="modal-header py-3">
              <h2 className="modal-title">{selectedCenter.name}</h2>

              {userLocation && (
                <div className="modal-distance">
                  <FaMapMarkerAlt className="distance-icon" />
                  {calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    selectedCenter.latitude,
                    selectedCenter.longitude
                  )}{" "}
                  km away
                </div>
              )}
            </div>

            <div className="modal-body">
              <div className="detail-card">
                <FaMapMarkerAlt className="detail-icon" />
                <div>
                  <h4>Address</h4>
                  <p>{selectedCenter.address}</p>
                </div>
              </div>

              <div className="detail-card">
                <FaPhone className="detail-icon" />
                <div>
                  <h4>Contact</h4>
                  <p>{selectedCenter.phone}</p>
                  {selectedCenter.email && <p>{selectedCenter.email}</p>}
                </div>
              </div>

              <div className="detail-card">
                <FaClock className="detail-icon" />
                <div>
                  <h4>Opening Hours</h4>
                  <p>{selectedCenter.opening_hours}</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="action-btn call-btn"
                onClick={() => window.open(`tel:${selectedCenter.phone}`)}
              >
                <FaPhone className="btn-icon" />
                Call Now
              </button>
              <button
                className="action-btn map-btn"
                onClick={() => openGoogleMaps(selectedCenter.latitude, selectedCenter.longitude)}
              >
                <FaMapMarkerAlt className="btn-icon" />
                Open in Google Maps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
