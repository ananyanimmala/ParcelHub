import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Register.css";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [agreeTerms, setAgreeTerms] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getPasswordStrength = () => {
        if (!password) {
            return {
                label: "",
                width: "0%",
                level: ""
            };
        }

        let score = 0;

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) {
            return {
                label: "Weak password",
                width: "25%",
                level: "weak"
            };
        }

        if (score === 2) {
            return {
                label: "Fair password",
                width: "50%",
                level: "fair"
            };
        }

        if (score === 3) {
            return {
                label: "Good password",
                width: "75%",
                level: "good"
            };
        }

        return {
            label: "Strong password",
            width: "100%",
            level: "strong"
        };
    };

    const passwordStrength = getPasswordStrength();

    const handleRegister = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please create a password.");
            return;
        }

        if (password.length < 6) {
            setError(
                "Password must contain at least 6 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!agreeTerms) {
            setError(
                "Please agree to the terms before creating your account."
            );
            return;
        }

        setLoading(true);

        try {
            await API.post("/auth/register", {
                name: name.trim(),
                email: email.trim(),
                password: password,
                role: "CUSTOMER"
            });

            setSuccess(
                "Account created successfully! Redirecting to login..."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {
            console.error(
                "Registration error:",
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
                        "Unable to create account."
                    );
                }
            } else if (error.request) {
                setError(
                    "Unable to connect to ParcelHub server. Please make sure Spring Boot is running."
                );
            } else {
                setError(
                    error.message ||
                    "Something went wrong."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            {/* LEFT PANEL */}

            <section className="register-showcase">

                <div className="register-showcase-content">

                    <div className="register-brand">

                        <div className="register-brand-icon">
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

                    <div className="register-hero">

                        <span className="register-tag">
                            JOIN PARCELHUB
                        </span>

                        <h1>
                            Your deliveries,
                            <br />
                            <span>
                                beautifully organized.
                            </span>
                        </h1>

                        <p>
                            Create your ParcelHub account and
                            manage your shipments from one
                            simple workspace.
                        </p>

                    </div>


                    <div className="register-benefits">

                        <div className="benefit-item">

                            <div className="benefit-icon">
                                📍
                            </div>

                            <div>
                                <strong>
                                    Track every shipment
                                </strong>

                                <span>
                                    Follow your parcel from
                                    pickup to delivery.
                                </span>
                            </div>

                        </div>


                        <div className="benefit-item">

                            <div className="benefit-icon">
                                🚚
                            </div>

                            <div>
                                <strong>
                                    Smarter deliveries
                                </strong>

                                <span>
                                    Stay updated throughout
                                    the delivery journey.
                                </span>
                            </div>

                        </div>


                        <div className="benefit-item">

                            <div className="benefit-icon">
                                🔒
                            </div>

                            <div>
                                <strong>
                                    Secure account
                                </strong>

                                <span>
                                    Your account information
                                    stays protected.
                                </span>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="register-decoration register-decoration-one"></div>
                <div className="register-decoration register-decoration-two"></div>

            </section>


            {/* REGISTER PANEL */}

            <section className="register-panel">

                <div className="register-container">

                    <div className="mobile-register-brand">

                        <div>
                            📦
                        </div>

                        <strong>
                            ParcelHub
                        </strong>

                    </div>


                    <div className="register-heading">

                        <span>
                            CREATE ACCOUNT
                        </span>

                        <h2>
                            Get started with ParcelHub
                        </h2>

                        <p>
                            Create your account in a few simple steps.
                        </p>

                    </div>


                    <form
                        className="register-form"
                        onSubmit={handleRegister}
                    >

                        {/* NAME */}

                        <div className="register-input-group">

                            <label htmlFor="name">
                                Full Name
                            </label>

                            <div className="register-input">

                                <span>
                                    👤
                                </span>

                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(event) =>
                                        setName(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="name"
                                />

                            </div>

                        </div>


                        {/* EMAIL */}

                        <div className="register-input-group">

                            <label htmlFor="register-email">
                                Email Address
                            </label>

                            <div className="register-input">

                                <span>
                                    ✉
                                </span>

                                <input
                                    id="register-email"
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


                        {/* PASSWORD */}

                        <div className="register-input-group">

                            <label htmlFor="register-password">
                                Password
                            </label>

                            <div className="register-input">

                                <span>
                                    🔒
                                </span>

                                <input
                                    id="register-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="register-password-toggle"
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


                            {password && (
                                <div className="password-strength">

                                    <div className="strength-track">

                                        <div
                                            className={`strength-fill ${passwordStrength.level}`}
                                            style={{
                                                width:
                                                    passwordStrength.width
                                            }}
                                        ></div>

                                    </div>

                                    <span
                                        className={
                                            passwordStrength.level
                                        }
                                    >
                                        {passwordStrength.label}
                                    </span>

                                </div>
                            )}

                        </div>


                        {/* CONFIRM PASSWORD */}

                        <div className="register-input-group">

                            <label htmlFor="confirm-password">
                                Confirm Password
                            </label>

                            <div className="register-input">

                                <span>
                                    🔐
                                </span>

                                <input
                                    id="confirm-password"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="register-password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    {showConfirmPassword
                                        ? "🙈"
                                        : "👁"}
                                </button>

                            </div>

                            {confirmPassword && (
                                <div
                                    className={`password-match ${
                                        password ===
                                        confirmPassword
                                            ? "matched"
                                            : "not-matched"
                                    }`}
                                >
                                    {password ===
                                    confirmPassword
                                        ? "✓ Passwords match"
                                        : "Passwords do not match"}
                                </div>
                            )}

                        </div>


                        {/* ROLE */}

                        <div className="account-type">

                            <div className="account-type-icon">
                                👤
                            </div>

                            <div>

                                <strong>
                                    Customer Account
                                </strong>

                                <span>
                                    Your new account starts as a
                                    customer account.
                                </span>

                            </div>

                            <span className="account-type-check">
                                ✓
                            </span>

                        </div>


                        {/* TERMS */}

                        <label className="terms-option">

                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(event) =>
                                    setAgreeTerms(
                                        event.target.checked
                                    )
                                }
                            />

                            <span className="terms-checkbox"></span>

                            <span>
                                I agree to the ParcelHub
                                <button
                                    type="button"
                                    onClick={(event) =>
                                        event.preventDefault()
                                    }
                                >
                                    Terms of Service
                                </button>
                                and
                                <button
                                    type="button"
                                    onClick={(event) =>
                                        event.preventDefault()
                                    }
                                >
                                    Privacy Policy
                                </button>
                            </span>

                        </label>


                        {/* ERROR */}

                        {error && (
                            <div className="register-error">

                                <span>
                                    ⚠️
                                </span>

                                <p>
                                    {error}
                                </p>

                            </div>
                        )}


                        {/* SUCCESS */}

                        {success && (
                            <div className="register-success">

                                <span>
                                    ✓
                                </span>

                                <p>
                                    {success}
                                </p>

                            </div>
                        )}


                        {/* BUTTON */}

                        <button
                            type="submit"
                            className="register-submit"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span className="register-spinner"></span>
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <span>
                                        →
                                    </span>
                                </>
                            )}

                        </button>

                    </form>


                    {/* LOGIN */}

                    <div className="login-link-section">

                        <span>
                            Already have an account?
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/login")
                            }
                        >
                            Sign in
                            <span>
                                →
                            </span>
                        </button>

                    </div>


                    <div className="register-footer">

                        <span>
                            🔒 Secure registration
                        </span>

                        <span>
                            © 2026 ParcelHub
                        </span>

                    </div>

                </div>

            </section>

        </div>
    );
}

export default Register;