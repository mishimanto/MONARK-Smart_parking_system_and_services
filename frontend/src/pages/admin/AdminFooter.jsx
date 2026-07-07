// src/components/AdminFooter.jsx
import React from "react";

export default function AdminFooter() {
  return (
    <footer className="admin-footer">
      <span>© {new Date().getFullYear()} MONARK. All rights reserved.</span>
      <span>Admin Workspace</span>
    </footer>
  );
}
