import React, { useEffect, useState } from "react";
import {
  FaBolt,
  FaCamera,
  FaCar,
  FaCheckCircle,
  FaEnvelope,
  FaFacebookF,
  FaHome,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhone,
  FaShieldAlt,
  FaTag,
  FaTwitter,
  FaWifi,
  FaYoutube,
} from "react-icons/fa";
import { API_BASE_URL } from "../api/client";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/contact-info`)
      .then((res) => res.json())
      .then((data) => setContactInfo(data))
      .catch((err) => console.error("Error fetching contact info:", err));
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const quickLinks = [
    { name: "Home", icon: FaHome, path: "/" },
    { name: "Parking", icon: FaCar, path: "/all-parkings" },
    { name: "Car Wash", icon: FaCar, path: "/services" },
    { name: "About Us", icon: FaCheckCircle, path: "/about" },
    { name: "Contact", icon: FaPhone, path: "/contact" },
  ];

  return (
    <footer className="border-t border-cyan-400/20 bg-[#0a1230] text-white">
      <div className="mx-auto max-w-295 py-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">              
              <div>
                <h3 className="text-2xl font-black tracking-wide">MONARK</h3>                
              </div>
            </div>
            <p className="mt-5 max-w-md leading-7 text-slate-300">
              Your trusted partner for smart parking solutions and premium car care services.             
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-200">
              {[
                { icon: FaShieldAlt, label: "24/7 Security", color: "text-emerald-400" },
                { icon: FaCamera, label: "CCTV Coverage", color: "text-sky-400" },
                { icon: FaWifi, label: "Free WiFi", color: "text-amber-400" },
                { icon: FaBolt, label: "EV Charging", color: "text-red-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 py-2">
                  {React.createElement(item.icon, { className: item.color })}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-1">
            <div>
              <h5 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-100">Quick Links</h5>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.path} className="group flex items-center gap-3 text-slate-300 transition hover:text-cyan-300">
                      {React.createElement(link.icon, { className: "text-sm text-cyan-300 transition group-hover:translate-x-1" })}
                      <span>{link.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>            
          </div>

          <div>
            <h5 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-100">Contact Info</h5>
            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="mt-1 text-cyan-300" />
                <div>
                  <p className="font-semibold text-white">{contactInfo?.address || "123 Parking Tower, City Center"}</p>
                  
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaPhone className="mt-1 text-cyan-300" />
                <div>
                  <p className="font-semibold text-white">{contactInfo?.phone || "+880 1XXX-XXXXXX"}</p>
                  
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaEnvelope className="mt-1 text-cyan-300" />
                <div>
                  <p className="font-semibold text-white">{contactInfo?.email || "support@monark.test"}</p>
                  
                </div>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="mt-8 flex max-w-sm overflow-hidden rounded-sm border border-cyan-300/20 bg-white/4">
              <input
                type="email"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="bg-cyan-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
                Send
              </button>
            </form>
            {subscribed && <p className="mt-2 text-sm font-semibold text-emerald-300">Thanks for subscribing!</p>}
          </div>
        </div>        

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} MONARK. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            {["Privacy Policy", "Terms of Service", "Parking Policy", "Safety & Security"].map((item) => (
              <a key={item} href="#" className="transition hover:text-blue-300">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
