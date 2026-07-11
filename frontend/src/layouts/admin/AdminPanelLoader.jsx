import React from "react";
import "../AdminLayout.css";

export default function AdminPanelLoader() {
  return (
    <div className="admin-panel-loader">
      <div className="admin-panel-loader-card">
        <span />
        <strong>Loading...</strong>
      </div>
    </div>
  );
}
