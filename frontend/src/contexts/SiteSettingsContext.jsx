import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSiteSettings } from "../api/client";
import { resolveAssetUrl } from "../utils/assets";

const fallbackSettings = {
  site_name: "MONARK",
  tagline: "Smart parking and premium car care",
  description: "Your trusted partner for smart parking solutions and premium car care services.",
  primary_phone: "+8801900000000",
  secondary_phone: "",
  support_email: "support@monark.test",
  business_email: "",
  address: "Chasara, Narayanganj, Dhaka",
  business_hours: "24/7 Support",
  facebook_url: "",
  twitter_url: "",
  linkedin_url: "",
  instagram_url: "",
  youtube_url: "",
  footer_description: "Your trusted partner for smart parking solutions and premium car care services.",
  copyright_text: "All rights reserved.",
  footer_features: ["24/7 Security", "CCTV Coverage", "Free WiFi", "EV Charging"],
};

const SiteSettingsContext = createContext({
  settings: fallbackSettings,
  loading: false,
  refreshSettings: async () => {},
});

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(fallbackSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await getSiteSettings();
      const payload = response?.data || response || {};
      setSettings({ ...fallbackSettings, ...payload });
    } catch (error) {
      console.error("Failed to fetch site settings:", error);
      setSettings((previous) => ({ ...fallbackSettings, ...previous }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    if (!settings.favicon) return;

    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    favicon.href = resolveAssetUrl(settings.favicon);
  }, [settings.favicon]);

  const value = useMemo(() => ({ settings, loading, refreshSettings }), [settings, loading, refreshSettings]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
