import React, { useState } from "react";
import { forgotPassword } from "../api/client";
import { Link } from "react-router-dom";
import { FaEnvelope, FaPaperPlane, FaRedo, FaCheckCircle } from "react-icons/fa";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const data = await forgotPassword(email);
      
      if (data.success) {
        setMessage("Password reset link has been sent to your email!");
        setIsError(false);
        setEmailSent(true);
      } else {
        setMessage(data.message || "Failed to send reset link");
        setIsError(true);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Handle validation errors
      if (error.errors && error.errors.email) {
        setMessage(error.errors.email[0]);
      } else {
        setMessage(error.message || "An error occurred. Please try again.");
      }
      setIsError(true);
    }

    setIsLoading(false);
  };

  return (
    <section className="auth-card">
      <div className="auth-card-heading">
        <h2>Forgot Password</h2>        
      </div>

                {message && (
        <div className={`auth-alert ${isError ? "is-error" : "is-success"}`}>
                    {message}
                  </div>
                )}

                {!emailSent ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <FaEnvelope />
                      <input
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        value={email}
                      />
          </label>
                    <button
                      type="submit"
            className="auth-submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                <span className="auth-spinner" />
                          Sending...
                        </>
                      ) : (
              <>
                <FaPaperPlane />
                Send Reset Link
              </>
                      )}
                    </button>
                  </form>
                ) : (
        <div className="auth-success-panel">
          <FaCheckCircle />
          <p>
                        We've sent password reset instructions to your email address.
                      </p>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                        setMessage("");
                      }}
            className="auth-secondary-btn"
                    >
            <FaRedo />
                      Try Another Email
                    </button>
                  </div>
                )}

      <div className="auth-links">
        <p>
                    Remember your password?{" "}
          <Link to="/login">
                      Back to Sign in
                    </Link>
                  </p>
                </div>
      
    </section>
  );
}
