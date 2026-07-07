import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "../components/css/Auth.css";

const authCopy = {
  "/register": {
    title: "Welcome back",
    text: "Join MONARK to book parking, schedule car care, and track your services from one place.",
    highlights: ["Quick registration", "Digital booking history", "Secure service access"],
  },
  "/forgot-password": {
    title: "Recover your account",
    text: "Enter your email and we will send you a password reset link to get back into MONARK.",
    highlights: ["Secure reset flow", "Email verification", "Fast account recovery"],
  },
  "/reset-password": {
    title: "Set a new password",
    text: "Create a fresh password and continue managing your parking and service bookings.",
    highlights: ["Protected reset link", "Password confirmation", "Back to dashboard faster"],
  },
  default: {
    title: "Welcome back",
    text: "Sign in to manage your parking bookings, services, and dashboard.",
    highlights: ["Secure parking bookings", "Car care service tracking", "Fast dashboard access"],
  },
};

export default function AuthLayout() {
  const location = useLocation();
  const copy = authCopy[location.pathname] || authCopy.default;

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-panel">
          <div className="auth-brand">
            <h1>{copy.title}</h1>
            <p>{copy.text}</p>
          </div>

          <div className="auth-highlights">
            {copy.highlights.map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </section>

        <Outlet />
      </div>
      <Link to="/" className="auth-back-home-link">
        Back to Home
      </Link>
    </main>
  );
}
