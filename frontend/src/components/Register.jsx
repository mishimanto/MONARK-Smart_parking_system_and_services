import React, { useState } from "react";
import { registerUser } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser, FaUserPlus } from "react-icons/fa";

export default function Register() {
    const [form, setForm] = useState({ name:"", email:"", password:"", password_confirmation:"" });
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setIsError(false);

        try {
            const data = await registerUser(form);

            if (data.status === "success") {
                setMessage("Registration successful! Redirecting to login...");
                setIsError(false);
                setTimeout(() => {
                    navigate("/login");
                }, 1200);
            } else {
                setMessage(data.message || "Something went wrong!");
                setIsError(true);
            }
        } catch (error) {
            const errors = error.response?.data?.errors;
            const firstError = errors ? Object.values(errors).flat()[0] : null;
            setMessage(firstError || error.response?.data?.message || error.message || "Registration failed. Please try again.");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
                <section className="auth-card">
                    <div className="auth-card-heading">
                        <h2>Create your account</h2>
                    </div>

                                {message && (
                        <div className={`auth-alert ${isError ? "is-error" : "is-success"}`}>
                                        {message}
                                    </div>
                                )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <label className="auth-field">
                            <FaUser />
                                        <input
                                            name="name"
                                            type="text"
                                            onChange={handleChange}
                                            placeholder="Full Name"
                                            required
                                        />
                        </label>

                        <label className="auth-field">
                            <FaEnvelope />
                                        <input
                                            name="email"
                                            type="email"
                                            onChange={handleChange}
                                            placeholder="Email"
                                            required
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

                        <label className="auth-field">
                            <FaLock />
                                        <input
                                            name="password_confirmation"
                                            type={showConfirmPassword ? "text" : "password"}
                                            onChange={handleChange}
                                            placeholder="Confirm Password"
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
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                    <span className="auth-spinner" />
                                                Registering...
                                            </>
                                        ) : (
                                <>
                                    <FaUserPlus />
                                    Register
                                </>
                                        )}
                                    </button>
                                </form>

                    <div className="auth-links">
                        <p>
                                        Already have an account? 
                            <Link to="/login">
                                             Sign In
                                        </Link>
                                    </p>
                                </div>

                    
                </section>
    );
}
