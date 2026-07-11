// src/components/AdminFooter.jsx
import React from "react";
import { useSiteSettings } from "../../contexts/SiteSettingsContext";

export default function AdminFooter() {
  const { settings } = useSiteSettings();

  return (
    <footer className="admin-footer">
      <span>© {new Date().getFullYear()} {settings.site_name}. {settings.copyright_text}</span>
      <span>Admin Workspace</span>
    </footer>
  );
}
