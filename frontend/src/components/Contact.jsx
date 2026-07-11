import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPhone,
} from "react-icons/fa";
import { API_BASE_URL } from "../api/client";
import { showErrorToast, showSuccessToast } from "../utils/toast";
import "./css/Contact.css";

const getDefaultContactData = () => ({
  address: "Chasara, Narayanganj, Dhaka",
  phone: "+8801900000000",
  email: "shimzo@gmail.com",
  map_embed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.448575332718!2d90.49608087589432!3d23.62410129361235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b10941d09f3f%3A0x9e53c62023606a5!2sChashara%2C%20Narayanganj!5e0!3m2!1sen!2sbd!4v1759514933929!5m2!1sen!2sbd" width="100%" height="250" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
});

export default function Contact() {
  const [contact, setContact] = useState(getDefaultContactData());
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    subject: "", 
    message: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapContainerRef = useRef(null);
  const [, setLoading] = useState(true);

  const fetchContactData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/contact`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contact data');
      }
      
      const data = await response.json();
      const contactData = data && data.length > 0 ? data[0] : getDefaultContactData();
      setContact(contactData);
      
      setTimeout(() => {
        if (contactData.map_embed && mapContainerRef.current) {
          mapContainerRef.current.innerHTML = contactData.map_embed;
        }
      }, 100);
      
    } catch (err) {
      console.error("Error fetching contact info:", err);
      setContact(getDefaultContactData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      showSuccessToast("Message sent", result.message || "Message sent successfully!");
      setForm({ 
        name: "", 
        email: "", 
        subject: "", 
        message: "" 
      });
      
    } catch (err) {
      console.error("Error sending message:", err);
      showErrorToast("Failed to send message", err.message || "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!contact) return <div className="contact-page"><p>No contact information available.</p></div>;

  return (
    <main className="contact-page">
      <div className="contact-shell">
        <section className="contact-layout">
          <aside className="contact-info-card">
            <h2>Contact Information</h2>
            <div className="contact-info-list">
              <div className="contact-info-item">
                <span className="contact-info-icon"><FaMapMarkerAlt /></span>
                <div>
                  <h3>Address</h3>
                  <p>{contact.address}</p>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-info-icon"><FaPhone /></span>
                <div>
                  <h3>Phone</h3>
                  <p>{contact.phone}</p>
                </div>
              </div>

              <div className="contact-info-item">
                <span className="contact-info-icon"><FaEnvelope /></span>
                <div>
                  <h3>Email</h3>
                  <p>{contact.email}</p>
                </div>
              </div>
            </div>

            <div className="contact-support-note">
              <span>Our support team available from 9:00 AM to 9:00 PM.</span>
            </div>            
          </aside>

          <section className="contact-form-card">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-field-grid">
                <input
                  className="contact-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
                <input
                  className="contact-input"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your email address"
                  required
                />
              </div>

              <input
                className="contact-input"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Subject"
                required
              />

              <textarea
                className="contact-input contact-textarea"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Your message"
                required
              />

              <button className="contact-submit-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="contact-btn-spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </section>
        </section>
        <section className="contact-form-card mt-5">
          {contact.map_embed && (
              <div className="contact-map-panel">
                <h3>Find Us Here</h3>
                <div ref={mapContainerRef} className="contact-map mt-3" />
              </div>
            )}
        </section>
      </div>
    </main>
  );
}
