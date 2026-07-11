import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaBullseye, FaEye, FaGithub, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import { getAbout } from "../api/client";
import { resolveAssetUrl } from "../utils/assets";
import { getInitialAvatar } from "../utils/avatar";
import "./css/About.css";

const ABOUT_FALLBACK_IMAGE = "/images/parking-hero.png";

export default function About() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAbout().then((res) => setData(res.data)).catch(console.error);
  }, []);

  const about = data?.about || {};
  const team = data?.team || [];
  const founder = team.find((member) => member.is_founder) || team[0] || null;
  const otherTeamMembers = founder ? team.filter((member) => member.id !== founder.id) : team;
  const aboutImage = resolveAssetUrl(about?.image, ABOUT_FALLBACK_IMAGE);
  const resolveTeamImage = (member) => resolveAssetUrl(member?.image, getInitialAvatar(member?.name));

  return (
    <main className="about-page">
      <div className="about-shell">
        <section className="about-hero">
          <div>
            <h1>About Us</h1>            
          </div>
          <div className="about-hero-media">
            <img
              src={aboutImage}
              alt={about?.title || "MONARK smart parking"}
              onError={(event) => {
                event.currentTarget.src = ABOUT_FALLBACK_IMAGE;
              }}
            />
          </div>
        </section>

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
        <section className="about-people-section">
          {founder && (
            <section className="about-founder-card">
              <div className="about-founder-image">
                <img
                  src={resolveTeamImage(founder)}
                  alt={founder.name}
                  onError={(event) => {
                    event.currentTarget.src = getInitialAvatar(founder.name);
                  }}
                />
              </div>
              <div className="about-founder-copy">
                <span>{founder.position || "Founder & CEO"}</span>
                <h2>{founder.name}</h2>
                <p>"{founder.bio}"</p>
                <div className="about-socials about-founder-socials">
                  {founder.linkedin_url && (
                    <a href={founder.linkedin_url} aria-label="LinkedIn">
                      <FaLinkedinIn />
                    </a>
                  )}
                  {founder.twitter_url && (
                    <a href={founder.twitter_url} aria-label="Twitter">
                      <FaTwitter />
                    </a>
                  )}
                  {founder.github_url && (
                    <a href={founder.github_url} aria-label="GitHub">
                      <FaGithub />
                    </a>
                  )}
                </div>
                <div className="about-founder-quote">Driving innovation and excellence in everything we do.</div>
              </div>
            </section>
          )}

          <section className="about-team-section">
            <div className="about-section-heading">
              <h2>Meet Our Team</h2>
            </div>

            {otherTeamMembers.length > 0 ? (
              <div className="about-team-grid">
                {otherTeamMembers.map((member, index) => (
                  <article className="about-team-card" key={member.id}>
                    <div className="about-team-image">
                      <img
                        src={resolveTeamImage(member)}
                        alt={member.name}
                        onError={(event) => {
                          event.currentTarget.src = getInitialAvatar(member.name);
                        }}
                      />
                    </div>
                    <div className="about-team-content">
                      <h3>{member.name}</h3>
                      <p>{member.position}</p>
                      <div className="about-socials">
                        {member.linkedin_url && (
                          <a href={member.linkedin_url} aria-label="LinkedIn">
                            <FaLinkedinIn />
                          </a>
                        )}
                        {member.twitter_url && (
                          <a href={member.twitter_url} aria-label="Twitter">
                            <FaTwitter />
                          </a>
                        )}
                        {member.github_url && (
                          <a href={member.github_url} aria-label="GitHub">
                            <FaGithub />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="about-team-empty">Team members will appear here after they are marked active from admin.</div>
            )}
          </section>
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
