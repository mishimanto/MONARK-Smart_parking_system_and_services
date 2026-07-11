import React, { useMemo, useState } from "react";
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
import { useSiteSettings } from "../contexts/SiteSettingsContext";
import { resolveAssetUrl } from "../utils/assets";

const featureIcons = [FaShieldAlt, FaCamera, FaWifi, FaBolt];
const featureColors = ["text-emerald-400", "text-sky-400", "text-amber-400", "text-red-400"];

export default function Footer() {
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const footerFeatures = useMemo(
    () => (Array.isArray(settings.footer_features) && settings.footer_features.length ? settings.footer_features : []),
    [settings.footer_features]
  );

  const socialLinks = useMemo(
    () => [
      { label: "Facebook", href: settings.facebook_url, icon: FaFacebookF },
      { label: "Twitter", href: settings.twitter_url, icon: FaTwitter },
      { label: "LinkedIn", href: settings.linkedin_url, icon: FaLinkedinIn },
      { label: "Instagram", href: settings.instagram_url, icon: FaInstagram },
      { label: "YouTube", href: settings.youtube_url, icon: FaYoutube },
    ].filter((social) => Boolean(social.href)),
    [settings.facebook_url, settings.instagram_url, settings.linkedin_url, settings.twitter_url, settings.youtube_url]
  );

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
                {settings.logo ? (
                  <img className="footer-brand-logo" src={resolveAssetUrl(settings.logo)} alt={settings.site_name} />
                ) : (
                  <h3 className="text-2xl font-black tracking-wide">{settings.site_name}</h3>
                )}
                
              </div>
            </div>            
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-200">
              {footerFeatures.map((label, index) => {
                const Icon = featureIcons[index % featureIcons.length];
                return (
                  <div key={label} className="flex items-center gap-2 py-2">
                    {React.createElement(Icon, { className: featureColors[index % featureColors.length] })}
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <a key={social.label} href={social.href} className="grid h-9 w-9 place-items-center border border-cyan-300/20 text-cyan-200 transition hover:bg-cyan-300 hover:text-slate-950" aria-label={social.label}>
                    {React.createElement(social.icon)}
                  </a>
                ))}
              </div>
            )}
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
                  <p className="font-semibold text-white">{settings.address}</p>
                  
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaPhone className="mt-1 text-cyan-300" />
                <div>
                  <p className="font-semibold text-white">{settings.primary_phone}</p>
                  
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaEnvelope className="mt-1 text-cyan-300" />
                <div>
                  <p className="font-semibold text-white">{settings.support_email}</p>
                  
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
          <p>&copy; {new Date().getFullYear()} {settings.site_name}. {settings.copyright_text}</p>
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
