import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resetNotice, setResetNotice] = useState("");

    const handleLogin = async (event) => {
        event.preventDefault();

        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await API.post(
                "/auth/login",
                {
                    email: email.trim(),
                    password: password
                }
            );

            const data = response.data;

            console.log("Login successful:", data);

            /*
             * Store authentication information
             */
            localStorage.setItem("token", data.token);
            localStorage.setItem("name", data.name);
            localStorage.setItem("email", data.email);
            localStorage.setItem("role", data.role);

            /*
             * Remember email if selected
             */
            if (rememberMe) {
                localStorage.setItem(
                    "rememberedEmail",
                    email.trim()
                );
            } else {
                localStorage.removeItem("rememberedEmail");
            }

            /*
             * Redirect according to role
             */
            if (data.role === "ADMIN") {
                navigate("/admin-dashboard");
            } else if (data.role === "DELIVERY_AGENT") {
                navigate("/agent-dashboard");
            } else {
                navigate("/dashboard");
            }

        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            if (error.response) {

                if (
                    typeof error.response.data ===
                    "string"
                ) {
                    setError(
                        error.response.data
                    );
                } else if (
                    error.response.data?.error
                ) {
                    setError(
                        error.response.data.error
                    );
                } else {
                    setError(
                        "Invalid email or password."
                    );
                }

            } else if (error.request) {

                setError(
                    "Unable to connect to ParcelHub server. Please make sure Spring Boot is running."
                );

            } else {

                setError(
                    error.message ||
                    "Something went wrong. Please try again."
                );
            }

        } finally {
            setLoading(false);
        }
    };


    const rememberedEmail =
        localStorage.getItem(
            "rememberedEmail"
        );

    /*
     * Fill remembered email once
     */
    if (
        rememberedEmail &&
        !email
    ) {
        setEmail(rememberedEmail);
    }


    return (
        <div className="login-page">

            {/* =================================
                LEFT BRANDING PANEL
            ================================= */}

            <section className="login-showcase">

                <div className="showcase-content">

                    {/* Brand */}

                    <div className="showcase-brand">

                        <div className="showcase-logo">
                            📦
                        </div>

                        <div>
                            <strong>
                                ParcelHub
                            </strong>

                            <span>
                                Smart Delivery Platform
                            </span>
                        </div>

                    </div>


                    {/* Main message */}

                    <div className="showcase-main">

                        <span className="showcase-tag">
                            SMARTER DELIVERY
                        </span>

                        <h1>
                            Every parcel.
                            <br />
                            <span>
                                One simple journey.
                            </span>
                        </h1>

                        <p>
                            Manage shipments, track deliveries,
                            and stay connected from pickup to
                            doorstep.
                        </p>

                    </div>


                    {/* Delivery Journey */}

                    <div className="journey-card">

                        <div className="journey-header">

                            <span>
                                LIVE DELIVERY JOURNEY
                            </span>

                            <span className="live-status">
                                <i></i>
                                ACTIVE
                            </span>

                        </div>


                        <div className="journey">

                            <div className="journey-item active">

                                <div className="journey-icon">
                                    ✓
                                </div>

                                <div>
                                    <strong>
                                        Pickup
                                    </strong>

                                    <span>
                                        Shipment booked
                                    </span>
                                </div>

                            </div>


                            <div className="journey-line">
                                <span></span>
                            </div>


                            <div className="journey-item active">

                                <div className="journey-icon">
                                    🚚
                                </div>

                                <div>
                                    <strong>
                                        In Transit
                                    </strong>

                                    <span>
                                        On the way
                                    </span>
                                </div>

                            </div>


                            <div className="journey-line">
                                <span></span>
                            </div>


                            <div className="journey-item">

                                <div className="journey-icon">
                                    🏠
                                </div>

                                <div>
                                    <strong>
                                        Delivered
                                    </strong>

                                    <span>
                                        Destination
                                    </span>
                                </div>

                            </div>

                        </div>

                    </div>


                    {/* Feature cards */}

                    <div className="showcase-features">

                        <div>
                            <span className="feature-icon">
                                ⚡
                            </span>

                            <div>
                                <strong>
                                    Fast
                                </strong>

                                <small>
                                    Smart delivery
                                </small>
                            </div>
                        </div>


                        <div>
                            <span className="feature-icon">
                                🔒
                            </span>

                            <div>
                                <strong>
                                    Secure
                                </strong>

                                <small>
                                    Protected data
                                </small>
                            </div>
                        </div>


                        <div>
                            <span className="feature-icon">
                                📍
                            </span>

                            <div>
                                <strong>
                                    Trackable
                                </strong>

                                <small>
                                    Real-time updates
                                </small>
                            </div>
                        </div>

                    </div>

                </div>


                {/* Decorative shapes */}

                <div className="showcase-circle circle-one"></div>
                <div className="showcase-circle circle-two"></div>
                <div className="showcase-glow"></div>

            </section>


            {/* =================================
                LOGIN PANEL
            ================================= */}

            <section className="login-panel">

                <div className="login-container">

                    {/* Mobile brand */}

                    <div className="mobile-login-brand">

                        <div className="mobile-logo">
                            📦
                        </div>

                        <strong>
                            ParcelHub
                        </strong>

                    </div>


                    {/* Heading */}

                    <div className="login-heading">

                        <span>
                            WELCOME BACK
                        </span>

                        <h2>
                            Sign in to your account
                        </h2>

                        <p>
                            Continue managing your shipments
                            with ParcelHub.
                        </p>

                    </div>


                    {/* Login form */}

                    <form
                        className="login-form"
                        onSubmit={handleLogin}
                    >

                        {/* Email */}

                        <div className="login-input-group">

                            <label htmlFor="email">
                                Email Address
                            </label>

                            <div className="login-input">

                                <span>
                                    ✉
                                </span>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="email"
                                />

                            </div>

                        </div>


                        {/* Password */}

                        <div className="login-input-group">

                            <div className="password-label-row">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <button
                                    type="button"
                                    className="forgot-button"
                                    onClick={() =>
                                        setResetNotice(
                                            "Password reset is not enabled yet. Please contact your ParcelHub administrator for help accessing your account."
                                        )
                                    }
                                >
                                    Forgot password?
                                </button>

                            </div>

                            <div className="login-input">

                                <span>
                                    🔒
                                </span>

                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="current-password"
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >
                                    {showPassword
                                        ? "🙈"
                                        : "👁"}
                                </button>

                            </div>

                        </div>


                        {/* Remember me */}

                        <div className="login-options">

                            <label className="remember-option">

                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(event) =>
                                        setRememberMe(
                                            event.target.checked
                                        )
                                    }
                                />

                                <span className="custom-checkbox"></span>

                                <span>
                                    Remember me
                                </span>

                            </label>

                        </div>


                        {/* Error */}

                        {error && (
                            <div className="login-error">

                                <span>
                                    ⚠️
                                </span>

                                <p>
                                    {error}
                                </p>

                            </div>
                        )}


                        {/* Submit */}

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span className="login-spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <span>
                                        →
                                    </span>
                                </>
                            )}

                        </button>

                    </form>

                    {resetNotice && (
                        <div className="login-reset-notice" role="status">
                            <span aria-hidden="true">ⓘ</span>
                            <p>{resetNotice}</p>
                            <button type="button" aria-label="Dismiss message" onClick={() => setResetNotice("")}>×</button>
                        </div>
                    )}

                    {/* Register */}

                    <div className="register-section">

                        <span>
                            Don't have an account?
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/register")
                            }
                        >
                            Create an account
                            <span>
                                →
                            </span>
                        </button>

                    </div>


                    {/* Security */}

                    <div className="login-security">

                        <span>
                            🔒
                        </span>

                        <p>
                            Your account and shipment data
                            are securely protected.
                        </p>

                    </div>


                    {/* Footer */}

                    <div className="login-footer">

                        <span>
                            © 2026 ParcelHub
                        </span>

                        <span>
                            Smart Parcel Tracking & Delivery
                        </span>

                    </div>

                </div>

            </section>

        </div>
    );
}

export default Login;