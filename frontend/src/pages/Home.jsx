import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBarChartBoxLine,
  RiCarLine,
  RiCheckboxCircleLine,
  RiCustomerService2Line,
  RiFlashlightLine,
  RiMapPin2Line,
  RiParkingBoxLine,
  RiQrCodeLine,
  RiShieldCheckLine,
  RiStarSFill,
  RiTimeLine,
  RiUserStarLine,
} from "react-icons/ri";
import { FaDirections } from "react-icons/fa";
import { APP_BASE_URL } from "../api/client";
import "./Home.css";

const BASE_URL = APP_BASE_URL;
const PARKING_FALLBACKS = ["/images/parking-lot1.jpg", "/images/parking-lot2.jpg", "/images/parking-lot3.jpg"];
const SERVICE_FALLBACKS = ["/images/parking-hero-3.jpg", "/images/parking-hero-2.jpg", "/images/parking-hero.png"];

const getFallbackImage = (type, index = 0) => {
    const images = type === "service" ? SERVICE_FALLBACKS : PARKING_FALLBACKS;
    return images[index % images.length];
};

const getImageUrl = (image, type = "parking", index = 0) => {
    if (!image || image === "null" || image === "undefined") {
        return getFallbackImage(type, index);
    }

    const trimmedImage = String(image).trim();

    if (/^https?:\/\//i.test(trimmedImage)) {
        return trimmedImage;
    }

    if (trimmedImage.startsWith("/images/")) {
        return trimmedImage;
    }

    const imagePath = trimmedImage.replace(/^\/+/, "");
    return `${BASE_URL}/${imagePath}`;
};

const handleImageError = (event, type, index = 0) => {
    const fallback = getFallbackImage(type, index);
    if (event.currentTarget.src.endsWith(fallback)) return;
    event.currentTarget.src = fallback;
};

const heroImages = [
    {
        id: 1,
        image: '/images/parking-hero.png',
        title: 'Smart Parking Solutions',
        bedge: 'PREMIUM PARKING SOLUTION',
        subtitle: 'Find and book premium parking spots in seconds',
        cta: 'Explore Locations',
        link: '/all-parkings'
    },
    {
        id: 2,
        image: '/images/parking-hero-2.jpg',
        title: '24/7 Secure Parking',
        bedge: 'PREMIUM PARKING SOLUTION',
        subtitle: 'Your vehicle is safe with our advanced security systems',
        cta: 'Explore Locations',
        link: '/all-parkings'
    },
    {
        id: 3,
        image: '/images/parking-hero-3.jpg',
        title: 'Premium Car Services',
        bedge: 'PREMIUM SERVICES',
        subtitle: 'Professional cleaning and maintenance for your vehicle',
        cta: 'View Services',
        link: '/services'
    }
];

export default function LandingPage() {
    const [parkingSpots, setParkingSpots] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    // Escape key handler for modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showModal) {
                setShowModal(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showModal]);
    


    useEffect(() => {
        // Auto slide for hero carousel
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);

        // Fetch parking spots
        fetch(`${BASE_URL}/api/parkings`)
            .then(res => res.json())
            .then(data => {
                const processedParkings = Array.isArray(data) ? data : (data.data || []);
                const processedWithUrls = processedParkings.map((parking, index) => ({
                    ...parking,
                    image: getImageUrl(parking.image, "parking", index)
                }));
                const latestParkings = processedWithUrls.slice(0, 3);
                setParkingSpots(latestParkings);
            })
            .catch(err => console.error("Error fetching parkings:", err));

        // Fetch services
        fetch(`${BASE_URL}/api/services`)
            .then(res => res.json())
            .then(data => {
                const servicesData = Array.isArray(data) ? data : (data.data || []);
                const processedServices = servicesData.map((service, index) => ({
                    ...service,
                    image: getImageUrl(service.image, "service", index)
                }));
                const featuredServices = processedServices.slice(0, 3);
                setServices(featuredServices);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching services:", err);
                setLoading(false);
            });

        return () => clearInterval(slideInterval);
    }, []);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const handleParkingSpotClick = (spotId) => {
        navigate(`/parking/${spotId}`);
    };

    const handleServiceClick = () => {
        navigate(`/services`);
    };

    const handleViewAllServices = () => {
        navigate("/services");
    };

    const handleViewAllParkings = () => {
        navigate("/all-parkings");
    };

    return (
        <div className="landing-home-page">
            {/* Enhanced Hero Section with Carousel */}
            <section className="home-hero-section">
                <div className="home-hero-carousel">
                    {heroImages.map((slide, index) => (
                        <div 
                            key={slide.id}
                            className={`home-hero-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${slide.image})` }}
                        >
                            <div className="home-hero-overlay"></div>
                            <div className="home-hero-content">
                                <div className="container">
                                    <div className="row justify-content-center text-center">
                                        <div className="col-lg-12 col-md-12">                                            
                                            <h1 className="home-hero-title">
                                                {slide.title}
                                            </h1>                                            
                                            <div className="home-hero-cta">
                                                <button
                                                    className="home-btn-neon-primary"
                                                    onClick={() => navigate(slide.link)}
                                                >
                                                    {slide.cta}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>          
                

                {/* Carousel Indicators */}
                <div className="home-carousel-indicators">
                    {heroImages.map((_, index) => (
                        <button
                            key={index}
                            className={`home-indicator ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            </section>

            {/* Trusted By Section */}
            <section className="home-trusted-section">
                <div className="container-fluid px-5">
                    <div className="row align-items-center">
                        <div className="col-md-3 text-center text-md-start">
                            <span className="home-trusted-label">Trusted by Industry Leaders</span>
                        </div>
                        <div className="col-md-9">
                            <div className="home-trusted-logos">
                                {['City Corporation', 'Mega Mall', 'Grand Hotel', 'Plaza Center', 'Tech Park'].map((logo, index) => (
                                    <span key={index} className="home-logo-item">
                                        {logo}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid Section */}
            <section className="home-features-section">
                <div className="container">
                    
                    <div className="row g-4">
                        {[
                            {
                                icon: <RiFlashlightLine />,
                                title: 'Instant Booking',
                                desc: 'Real-time availability and instant confirmation'
                            },
                            {
                                icon: <RiShieldCheckLine />,
                                title: 'Military Grade Security',
                                desc: '24/7 surveillance and advanced security systems'
                            },
                            {
                                icon: <RiQrCodeLine />,
                                title: 'Digital Access',
                                desc: 'Seamless entry and exit with QR technology'
                            },
                            {
                                icon: <RiBarChartBoxLine />,
                                title: 'Smart Analytics',
                                desc: 'AI-powered insights and occupancy tracking'
                            },
                            {
                                icon: <RiCustomerService2Line />,
                                title: 'Premium Support',
                                desc: 'Dedicated customer service team'
                            },
                            {
                                icon: <RiParkingBoxLine />,
                                title: 'Valet Service',
                                desc: 'Professional valet parking available'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="col-lg-4 col-md-6">
                                <div className="home-feature-card">
                                    <div className="home-feature-icon">
                                        {feature.icon}
                                    </div>
                                    <h5>{feature.title}</h5>
                                    <p>{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Latest Parking Spots Section */}
            <section className="home-parking-section">
                <div className="container-fluid px-5">
                    <div className="home-section-header text-center mb-5">                        
                        <h2 className="home-section-title">Premium Parking Near You</h2>                        
                    </div>
                    
                    <div className="row g-4">
                        {parkingSpots.map((spot) => {
                            return (
                                <div key={spot.id} className="col-lg-4 col-md-6 p-4">
                                    <div 
                                        className="home-parking-card h-100"
                                        onClick={() => handleParkingSpotClick(spot.id)}
                                    >
                                        <div className="home-card-image">
                                            <img 
                                                src={spot.image} 
                                                className="home-card-img" 
                                                alt={spot.name}
                                                loading="lazy"
                                                onError={(event) => handleImageError(event, "parking", spot.id)}
                                            />
                                            <div className="home-card-image-shade"></div>
                                            <div className="home-card-badge">
                                                <span className={`home-availability-badge ${spot.available_slots > 0 ? 'available' : 'full'}`}>
                                                    {spot.available_slots > 0 ? 
                                                        `${spot.available_slots} Available` : 
                                                        'Fully Booked'
                                                    }
                                                </span>
                                            </div>
                                            <div className="home-distance-badge">
                                                <FaDirections className="me-1" />
                                                {spot.distance || 'Premium Location'}
                                            </div>
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
                                                        className={`${spot.available_slots > 0 ? 'home-btn-neon-primary' : 'home-btn-neon-secondary'}`}
                                                        disabled={spot.available_slots === 0}
                                                    >
                                                        {spot.available_slots > 0 ? 'Book Now' : 'Fully Booked'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {parkingSpots.length === 0 && !loading && (
                        <div className="text-center py-5">
                            <div className="home-empty-state">
                                <RiCarLine className="home-empty-icon mb-3" />
                                <h4>No Parking Spots Available</h4>
                                <p>Premium locations coming soon</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center">
                        <button 
                            className="home-btn-neon-outline px-5"
                            onClick={handleViewAllParkings}
                        >
                            <RiMapPin2Line className="me-2" />
                            Explore All Locations
                        </button>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="home-services-section">
                <div className="container-fluid px-5">
                    <div className="home-section-header text-center mb-5">                        
                        <h2 className="home-section-title">Car Care Services</h2>
                        
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="home-spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading elite services...</p>
                        </div>
                    ) : (
                        <>
                            <div className="row g-4">
                                {services.map((service) => (
                                    <div key={service.id} className="col-lg-4 col-md-6 p-4">
                                        <div 
                                            className="home-service-card h-100"
                                            onClick={() => handleServiceClick(service.id)}
                                        >
                                            <div className="home-service-image">
                                                <img 
                                                    src={service.image} 
                                                    alt={service.name}
                                                    className="home-service-img"
                                                    loading="lazy"
                                                    onError={(event) => handleImageError(event, "service", service.id)}
                                                />
                                                <div className="home-card-image-shade"></div>
                                                <div className="home-service-overlay">
                                                    <span className="home-service-price">
                                                        BDT {service.price}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="home-service-content">
                                                <h5 className="home-service-title">{service.name}</h5>
                                                <p className="home-service-description">
                                                    {service.description}
                                                </p>
                                                <div className="home-service-meta">
                                                    <div className="home-service-duration">
                                                        <RiTimeLine className="me-2" />
                                                        <span>{service.duration || "Flexible timing"}</span>
                                                    </div>
                                                    <div className="home-service-rating">
                                                        <RiStarSFill className="me-1" />
                                                        <span>4.5</span>
                                                    </div>
                                                </div>
                                                <div className="home-service-footer">
                                                    <button className="home-btn-neon-primary">
                                                        Book This Service
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {services.length === 0 && !loading && (
                                <div className="text-center py-5">
                                    <div className="home-empty-state">
                                        <RiCarLine className="home-empty-icon mb-3" />
                                        <h4>Premium Services Coming Soon</h4>
                                        <p>Elite car care services launching soon</p>
                                    </div>
                                </div>
                            )}

                            <div className="text-center">
                                <button 
                                    className="home-btn-neon-outline px-5"
                                    onClick={handleViewAllServices}
                                >
                                    <RiCarLine className="me-2" />
                                    View All Services
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Stats Section */}
            <section className="home-stats-section">
                <div className="container">
                    <div className="row text-center">
                        {[
                            { number: '1000+', label: 'Premium Bookings', icon: <RiCarLine /> },
                            { number: '50+', label: 'Elite Locations', icon: <RiMapPin2Line /> },
                            { number: '50,000+', label: 'Satisfied Clients', icon: <RiUserStarLine /> },
                            { number: '24/7', label: 'Concierge Support', icon: <RiTimeLine /> }
                        ].map((stat, index) => (
                            <div key={index} className="col-lg-3 col-md-6 mb-4">
                                <div className="home-stat-box">
                                    <div className="home-stat-icon">
                                        {stat.icon}
                                    </div>
                                    <h3 className="home-stat-number">{stat.number}</h3>
                                    <p className="home-stat-label">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="home-cta-section">
                <div className="container-fluid px-5">
                    <div className="home-cta-card">
                        <div className="row align-items-center">
                            <div className="col-lg-8">
                                <h2 className="home-cta-title">Ready for Elite Parking Experience?</h2>
                                
                                <div className="home-cta-features">
                                    {['No Hidden Charges', 'Instant Confirmation', 'Premium Support', 'Secure Payments'].map((feature, index) => (
                                        <span key={index} className="home-cta-feature-item">
                                            <RiCheckboxCircleLine className="me-2" />
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="col-lg-4 text-lg-end">
                                <button 
                                    className="home-btn-neon-primary px-5"
                                    onClick={() => setShowModal(true)}
                                >
                                    Get Started Today
                                </button>

                                {/* Professional Modal */}
                                {showModal && ReactDOM.createPortal(
                                    <div className="home-modal-overlay" onClick={() => setShowModal(false)}>
                                        <div className="home-modal-content" onClick={(e) => e.stopPropagation()}>
                                            {/* Modal Body - Fixed Height */}
                                            <div className="home-modal-body">
                                                <div className="home-modal-features mb-4">
                                                    <div className="row text-center">
                                                        <div className="col-6">
                                                            <div className="home-feature-badge text-light">
                                                                <RiCheckboxCircleLine className="text-success me-2" />
                                                                No Hidden Charges
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="home-feature-badge text-light">
                                                                <RiCheckboxCircleLine className="text-success me-2" />
                                                                Instant Confirmation
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row g-4">
                                                    <div className="col-md-6">
                                                        <div 
                                                            className="home-modal-option-card"
                                                            onClick={() => {
                                                                navigate("/all-parkings");
                                                                setShowModal(false);
                                                            }}
                                                        >
                                                            <div className="home-option-icon parking">
                                                                <RiParkingBoxLine />
                                                            </div>
                                                            <h5>Find Parking</h5>
                                                            
                                                            <div className="home-option-features mx-5 p-3">
                                                                <span><RiCheckboxCircleLine /> Real-time availability</span>
                                                                <span><RiCheckboxCircleLine /> Secure locations</span>
                                                                <span><RiCheckboxCircleLine /> Instant booking</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-md-6">
                                                        <div 
                                                            className="home-modal-option-card"
                                                            onClick={() => {
                                                                navigate("/services");
                                                                setShowModal(false);
                                                            }}
                                                        >
                                                            <div className="home-option-icon service">
                                                                <RiCarLine />
                                                            </div>
                                                            <h5>Car Services</h5>
                                                            <div className="home-option-features mx-5 p-3">
                                                                <span><RiCheckboxCircleLine /> Professional service</span>
                                                                <span><RiCheckboxCircleLine /> Quality guaranteed</span>
                                                                <span><RiCheckboxCircleLine /> Quick delivery</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>                                            
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
