// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { loginUser } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaSignInAlt } from "react-icons/fa";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    const data = await loginUser(form);

    if (data.access_token && data.user) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setMessage("Login successful! Redirecting...");
      setIsError(false);

      setTimeout(() => {
        if (data.user.role === "admin") navigate("/admin");
        else if (data.user.role === "manager") navigate("/manager");
        else if (data.user.role === "mechanic") navigate("/mechanic/dashboard");
        else navigate("/dashboard");
      }, 1000);
    } else {
      setMessage(data.message || "Login failed");
      setIsError(true);
    }

    setIsLoading(false);
  };


  return (
    <section className="auth-card">
      <div className="auth-card-heading">
        <h2>Access your account</h2>
      </div>

      {message && (
        <div className={`auth-alert ${isError ? "is-error" : "is-success"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <label className="auth-field">
          <FaEnvelope />
          <input
            name="email"
            type="email"
            onChange={handleChange}
            placeholder="Email"
            required
            value={form.email}
          />
        </label>

        <label className="auth-field">
          <FaLock />
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            onChange={handleChange}
            placeholder="Password"
            required
            value={form.password}
          />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </label>

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="auth-spinner" />
              Signing In...
            </>
          ) : (
            <>
              <FaSignInAlt />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="auth-links">
        <p>
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
        <Link to="/forgot-password" className="auth-forgot-link">
          Forgot password?
        </Link>
      </div>
    </section>
  );
}
