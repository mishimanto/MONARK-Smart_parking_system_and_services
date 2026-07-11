// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { loginUser, verifyAdminTwoFactor } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { FaEnvelope, FaEye, FaEyeSlash, FaKey, FaLock, FaSignInAlt } from "react-icons/fa";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState({
    required: false,
    challengeToken: "",
    code: "",
  });

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const finishLogin = (data) => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    const data = twoFactor.required
      ? await verifyAdminTwoFactor({
          challenge_token: twoFactor.challengeToken,
          code: twoFactor.code,
        })
      : await loginUser(form);

    if (data.access_token && data.user) {
      finishLogin(data);
    } else if (data.requires_2fa && data.challenge_token) {
      setTwoFactor({
        required: true,
        challengeToken: data.challenge_token,
        code: "",
      });
      setMessage(
        data.verification_code
          ? `${data.message}`
          : data.message || "Verification code sent to your email."
      );
      setIsError(false);
    } else {
      setMessage(data.message || "Login failed");
      setIsError(true);
    }

    setIsLoading(false);
  };

  const resetTwoFactor = () => {
    setTwoFactor({ required: false, challengeToken: "", code: "" });
    setMessage("");
    setIsError(false);
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
        {twoFactor.required ? (
          <>
            <label className="auth-field">
              <FaKey />
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                onChange={(event) => setTwoFactor((current) => ({ ...current, code: event.target.value.replace(/\D/g, "").slice(0, 6) }))}
                placeholder="6-digit verification code"
                required
                value={twoFactor.code}
              />
            </label>
            <button type="button" className="auth-secondary-btn" onClick={resetTwoFactor} disabled={isLoading}>
              Use another account
            </button>
          </>
        ) : (
          <>
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
          </>
        )}

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="auth-spinner" />
              {twoFactor.required ? "Verifying..." : "Signing In..."}
            </>
          ) : (
            <>
              <FaSignInAlt />
              {twoFactor.required ? "Verify Admin Login" : "Sign In"}
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
