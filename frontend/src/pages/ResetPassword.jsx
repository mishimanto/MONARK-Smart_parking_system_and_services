import React, { useState } from "react";
import { resetPassword } from "../api/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaSignInAlt } from "react-icons/fa";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    password: "",
    password_confirmation: ""
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!token || !email) {
    setMessage("Invalid reset link");
    setIsError(true);
    return;
  }

  setIsLoading(true);
  setMessage("");
  setIsError(false);

  try {
    const resetData = {
      token,
      email,
      password: form.password,
      password_confirmation: form.password_confirmation
    };

    const data = await resetPassword(resetData);
    
    if (data.success) {
      setMessage("Password reset successfully! Redirecting to login...");
      setIsError(false);
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setMessage(data.message || "Failed to reset password");
      setIsError(true);
    }
  } catch (error) {
    console.error('Reset password error:', error);
    
    // Specific error handling
    if (error.message?.includes('Invalid or expired')) {
      setMessage("This reset link is invalid or has expired. Please request a new password reset.");
    } else if (error.message?.includes('Password must be')) {
      setMessage("Password must be at least 8 characters long.");
    } else if (error.message?.includes('confirmation does not match')) {
      setMessage("Password confirmation does not match. Please try again.");
    } else {
      setMessage(error.message || "An error occurred. Please try again.");
    }
    setIsError(true);
  }

  setIsLoading(false);
};

  if (!token || !email) {
    return (
      <section className="auth-card">
          <div className="auth-alert is-error">
            <h4>Invalid Reset Link</h4>
            <p>The password reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="auth-inline-link">
              Request New Link
            </Link>
          </div>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <div className="auth-card-heading">
        <h2>Reset Password</h2>
        <p className="auth-card-subtitle">
                    Enter your new password
        </p>
      </div>

                {message && (
        <div className={`auth-alert ${isError ? "is-error" : "is-success"}`}>
                    {message}
                  </div>
                )}

      <form onSubmit={handleSubmit} className="auth-form">
        <label className="auth-field">
          <FaLock />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      onChange={handleChange}
                      placeholder="New Password"
                      required
                      minLength="8"
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
        <div className="auth-help-text">Password must be at least 8 characters</div>

        <label className="auth-field">
          <FaLock />
                    <input
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      onChange={handleChange}
                      placeholder="Confirm New Password"
                      required
                      value={form.password_confirmation}
                    />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowConfirmPassword((value) => !value)}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </label>

                  <button
                    type="submit"
          className="auth-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
              <span className="auth-spinner" />
                        Resetting...
                      </>
                    ) : (
            <>
              <FaSignInAlt />
              Reset Password
            </>
                    )}
                  </button>
                </form>

      <div className="auth-links">
        <p>
                    <Link to="/login">
                      Back to Sign in
                    </Link>
                  </p>
                </div>
      <p className="auth-footer">
                &copy; {new Date().getFullYear()} MONARK. All rights reserved.
              </p>
    </section>
  );
}
