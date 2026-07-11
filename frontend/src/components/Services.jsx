import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaClock, FaCalendarAlt, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { RiStarSFill } from "react-icons/ri";
import { API_BASE_URL, APP_BASE_URL } from "../api/client";
import ServicePagination from "./ServicePagination";
import './css/Services.css';

const BASE_URL = `${APP_BASE_URL}/`;
const SERVICE_FALLBACKS = ["/images/parking-hero-3.jpg", "/images/parking-hero-2.jpg", "/images/parking-hero.png"];

const getServiceFallback = (index = 0) => SERVICE_FALLBACKS[index % SERVICE_FALLBACKS.length];

const resolveServiceImage = (image, index = 0) => {
  if (!image || image === "null" || image === "undefined") return getServiceFallback(index);
  const imageValue = String(image).trim();
  if (/^https?:\/\//i.test(imageValue)) return imageValue;
  if (imageValue.startsWith("/images/")) return imageValue;
  return `${BASE_URL}${imageValue.replace(/^\/+/, "")}`;
};

const handleServiceImageError = (event, index = 0) => {
  const fallback = getServiceFallback(index);
  if (event.currentTarget.src.endsWith(fallback)) return;
  event.currentTarget.src = fallback;
};


export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 9,
    total: 0,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE_URL}/services`, {
        params: {
          page,
          per_page: pagination.per_page,
          q: debouncedSearch || undefined,
        },
      });

      let servicesData = [];
      let paginationData = {
        current_page: 1,
        last_page: 1,
        per_page: pagination.per_page,
        total: 0,
      };

      if (Array.isArray(response.data)) {
        servicesData = response.data;
      } else if (response.data.services && Array.isArray(response.data.services)) {
        servicesData = response.data.services;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        servicesData = response.data.data;
        paginationData = {
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || pagination.per_page,
          total: response.data.total || response.data.data.length,
        };
      }

      setServices(servicesData);
      setPagination(paginationData);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services. Please try again later.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pagination.per_page]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleBookClick = (service) => {
    navigate(`/services/${service.id}`);
  };

  return (
    <div className="services-container">
      <div className="services-header">
        <h1 className="services-title">Car Services</h1>
      </div>

      <div className="services-toolbar">
        <label className="services-search" htmlFor="servicesSearch">
          <FaSearch />
          <input
            id="servicesSearch"
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search services, type, or center"
          />
        </label>

        <Link className="services-centers-link" to="/service-centers">
          <FaMapMarkerAlt />
          Service Centers
        </Link>
      </div>

      {error && (
        <div className="services-alert services-alert-error">
          {error}
          <button onClick={fetchServices} className="services-retry-btn">Retry</button>
        </div>
      )}

      <div className="services-grid">
        {loading ? (
          <div className="services-loading-spinner">
            <div className="services-spinner"></div>
            <p>Loading services...</p>
          </div>
        ) : services.length > 0 ? (
          services.map((service, index) => (
            <div
              key={service.id}
              className="service-card"
            >
              <div className="service-image-container">
                <img
                  src={resolveServiceImage(service.image, index)}
                  alt={service.name}
                  className="service-image"
                  onError={(event) => handleServiceImageError(event, index)}
                />
                <div className="service-image-shade" />
                <span className="service-image-price">BDT {service.price}</span>
              </div>

              <div className="service-content">
                <div className="service-card-heading">
                  <button type="button" className="service-title service-title-link" onClick={() => handleBookClick(service)}>
                    {service.name}
                  </button>
                  <div className="service-rating">
                    <RiStarSFill />
                    <span>4.5</span>
                  </div>
                </div>
                <p className="service-description">{service.description}</p>
                
                <div className="service-action-row">
                  <div className="service-details">
                    <div className="service-price">
                      <span className="service-amount">BDT {service.price}</span>
                    </div>
                    <div className="service-duration">
                      <FaClock className="service-time-icon" />
                      <span className="service-time">{service.duration}</span>
                    </div>
                  </div>

                  <button
                    className="service-book-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleBookClick(service);
                    }}
                  >
                    <FaCalendarAlt className="btn-icon" />
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          !loading && (
            <div className="services-empty">
              <div className="services-empty-icon">🔍</div>
              <h3>No Services Available</h3>
              <p>Please check back later for available services</p>
            </div>
          )
        )}
      </div>

      <ServicePagination
        pagination={pagination}
        loading={loading}
        onPageChange={setPage}
      />
    </div>
  );
}
