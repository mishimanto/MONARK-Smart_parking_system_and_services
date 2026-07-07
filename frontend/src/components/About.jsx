import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaBullseye, FaEye, FaGithub, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import { getAbout } from "../api/client";
import "./css/About.css";

export default function About() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAbout().then((res) => setData(res.data)).catch(console.error);
  }, []);

  const about = data?.about || {};
  const team = data?.team || [];
  const founder = team.length > 0 ? team[0] : null;
  const otherTeamMembers = team.length > 1 ? team.slice(1) : [];

  return (
    <main className="about-page">
      <div className="about-shell">
        
        <section className="about-value-grid">
          <div className="about-value-card">
            <span className="about-value-icon">
              <FaBullseye />
            </span>
            <div className="about-value-content">
              <h2>Our Mission</h2>
              <p>{about?.mission}</p>
            </div>
          </div>

          <div className="about-value-card">
            <span className="about-value-icon">
              <FaEye />
            </span>
            <div className="about-value-content">
              <h2>Our Vision</h2>
              <p>{about?.vision}</p>
            </div>
          </div>
        </section>

        <section className="about-stats-grid">
          {[
            { value: "24/7", label: "Parking & service support" },
            { value: "50+", label: "Parking and care locations" },
            { value: "1K+", label: "Successful customer bookings" },
            { value: "100%", label: "Digital booking workflow" },
          ].map((item) => (
            <div className="about-stat-card" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <section className="about-detail-section">
          <div className="about-detail-copy">
            <span className="about-kicker">What We Do</span>
            <h2>Parking and car care, connected in one experience</h2>
            
          </div>
          <div className="about-feature-list">
            {[
              "Real-time parking discovery and booking",
              "Verified service centers and car care options",
              "Digital records for bookings and service orders",
              "Customer support for parking and maintenance needs",
            ].map((feature) => (
              <div className="about-feature-row" key={feature}>
                <span />
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="about-process-section">
          <div className="about-section-heading">
            <h2>How MONARK works</h2>
          </div>
          <div className="about-process-grid">
            {[
              { step: "01", title: "Find", text: "Choose a parking location or car service from available options." },
              { step: "02", title: "Book", text: "Reserve your slot or schedule your service with clear pricing." },
              { step: "03", title: "Arrive", text: "Use the confirmed booking details to access the location smoothly." },
              { step: "04", title: "Manage", text: "Track service and booking activity from your account." },
            ].map((item) => (
              <article className="about-process-card" key={item.step}>
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        {founder && (
          <section className="about-founder-card">
            <div className="about-founder-image">
              <img src={founder.image} alt={founder.name} />
            </div>
            <div className="about-founder-copy">
              <span>Founder & CEO</span>
              <h2>{founder.name}</h2>
              <p>"{founder.bio}"</p>
              <div className="about-founder-quote">Driving innovation and excellence in everything we do.</div>
            </div>
          </section>
        )}

        {otherTeamMembers.length > 0 && (
          <section className="about-team-section">
            <div className="about-section-heading">
              <span className="about-kicker">Team</span>
              <h2>Meet Our Team</h2>
            </div>

            <div className="about-team-grid">
              {otherTeamMembers.map((member) => (
                <article className="about-team-card" key={member.id}>
                  <div className="about-team-image">
                    <img src={member.image} alt={member.name} />
                  </div>
                  <div className="about-team-content">
                    <h3>{member.name}</h3>
                    <p>{member.position}</p>
                    <div className="about-socials">
                      <a href="#" aria-label="LinkedIn">
                        <FaLinkedinIn />
                      </a>
                      <a href="#" aria-label="Twitter">
                        <FaTwitter />
                      </a>
                      <a href="#" aria-label="GitHub">
                        <FaGithub />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="about-cta">
          <div>
            <h2>Ready to park smarter?</h2>
            
          </div>
          <Link to="/services" className="about-primary-btn">
            View Services <FaArrowRight />
          </Link>
        </section>
      </div>
    </main>
  );
}
