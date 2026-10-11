import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "./TrackParcel.css";

function TrackParcel() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [parcel, setParcel] = useState(null);
    const [trackingHistory, setTrackingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const name = localStorage.getItem("name") || "Customer";

    const getStatusLabel = (status) => {
        const labels = {
            BOOKED: "Booked",
            PICKED_UP: "Picked Up",
            IN_TRANSIT: "In Transit",
            OUT_FOR_DELIVERY: "Out for Delivery",
            DELIVERED: "Delivered",
            CANCELLED: "Cancelled"
        };

        return labels[status] || status || "Unknown";
    };

    const getStatusIcon = (status) => {
        const icons = {
            BOOKED: "📋",
            PICKED_UP: "📦",
            IN_TRANSIT: "🚚",
            OUT_FOR_DELIVERY: "🛵",
            DELIVERED: "✅",
            CANCELLED: "❌"
        };

        return icons[status] || "📦";
    };

    const getProgress = (status) => {
        const progress = {
            BOOKED: 20,
            PICKED_UP: 40,
            IN_TRANSIT: 60,
            OUT_FOR_DELIVERY: 80,
            DELIVERED: 100,
            CANCELLED: 0
        };

        return progress[status] || 0;
    };

    const journeySteps = [
        {
            status: "BOOKED",
            label: "Booked",
            icon: "📋"
        },
        {
            status: "PICKED_UP",
            label: "Picked Up",
            icon: "📦"
        },
        {
            status: "IN_TRANSIT",
            label: "In Transit",
            icon: "🚚"
        },
        {
            status: "OUT_FOR_DELIVERY",
            label: "Out for Delivery",
            icon: "🛵"
        },
        {
            status: "DELIVERED",
            label: "Delivered",
            icon: "✓"
        }
    ];

    const getStepIndex = (status) => {
        const indexes = {
            BOOKED: 0,
            PICKED_UP: 1,
            IN_TRANSIT: 2,
            OUT_FOR_DELIVERY: 3,
            DELIVERED: 4,
            CANCELLED: -1
        };

        return indexes[status] ?? 0;
    };

    const currentStepIndex = useMemo(() => {
        return getStepIndex(parcel?.status);
    }, [parcel?.status]);

    const fetchTrackingData = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [parcelResponse, trackingResponse] =
                await Promise.all([
                    API.get(`/parcels/${id}`),
                    API.get(`/tracking/parcel/${id}`)
                ]);

            setParcel(parcelResponse.data);
            setTrackingHistory(trackingResponse.data || []);
        } catch (err) {
            console.error(
                "Tracking page error:",
                err
            );

            if (err.response?.status === 403) {
                setError(
                    "You are not authorized to view this shipment."
                );
            } else if (err.response?.status === 404) {
                setError(
                    "This shipment could not be found."
                );
            } else {
                setError(
                    "Unable to load shipment information."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTrackingData();
    }, [id]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("role");

        navigate("/login");
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "Recently";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Recently";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const formatTime = (dateValue) => {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    const sortedHistory = useMemo(() => {
        return [...trackingHistory].sort(
            (a, b) =>
                new Date(a.updatedAt) -
                new Date(b.updatedAt)
        );
    }, [trackingHistory]);

    if (loading) {
        return (
            <div className="track-page track-loading-page">

                <div className="track-loader-card">

                    <div className="track-loader-icon">
                        📦
                    </div>

                    <div className="track-loader-spinner"></div>

                    <h2>
                        Loading shipment
                    </h2>

                    <p>
                        We're retrieving your latest
                        tracking information...
                    </p>

                </div>

            </div>
        );
    }

    if (error || !parcel) {
        return (
            <div className="track-page">

                <header className="track-topbar">

                    <button
                        className="track-back-button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ←
                        <span>
                            Back to Dashboard
                        </span>
                    </button>

                    <div className="track-brand">
                        <div className="track-brand-icon">
                            📦
                        </div>

                        <div>
                            <strong>
                                ParcelHub
                            </strong>

                            <span>
                                Smart Delivery
                            </span>
                        </div>
                    </div>

                    <button
                        className="track-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </header>

                <main className="track-error-container">

                    <div className="track-error-card">

                        <div className="track-error-icon">
                            ⚠️
                        </div>

                        <h1>
                            Shipment unavailable
                        </h1>

                        <p>
                            {error ||
                                "We couldn't find this shipment."}
                        </p>

                        <button
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            Back to Dashboard
                        </button>

                    </div>

                </main>

            </div>
        );
    }

    const progress = getProgress(parcel.status);

    return (
        <div className="track-page">

            {/* ================= TOPBAR ================= */}

            <header className="track-topbar">

                <button
                    className="track-back-button"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ←
                    <span>
                        Back to Dashboard
                    </span>
                </button>

                <div className="track-brand">

                    <div className="track-brand-icon">
                        📦
                    </div>

                    <div>
                        <strong>
                            ParcelHub
                        </strong>

                        <span>
                            Smart Delivery
                        </span>
                    </div>

                </div>

                <div className="track-user-actions">

                    <div className="track-user">

                        <div className="track-user-avatar">
                            {name
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <span>
                            {name}
                        </span>

                    </div>

                    <button
                        className="track-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>

            {/* ================= MAIN ================= */}

            <main className="track-main">

                {/* PAGE HEADING */}

                <section className="track-heading">

                    <div>

                        <span className="track-label">
                            SHIPMENT TRACKING
                        </span>

                        <h1>
                            Track your parcel
                        </h1>

                        <p>
                            Follow your shipment's journey
                            from pickup to destination.
                        </p>

                    </div>

                    <button
                        className="refresh-button"
                        onClick={() =>
                            fetchTrackingData(true)
                        }
                        disabled={refreshing}
                    >
                        <span
                            className={
                                refreshing
                                    ? "refresh-icon spinning"
                                    : "refresh-icon"
                            }
                        >
                            ↻
                        </span>

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                </section>

                {/* ================= STATUS HERO ================= */}

                <section className="track-status-card">

                    <div className="status-main">

                        <div className="status-icon-large">
                            {getStatusIcon(
                                parcel.status
                            )}
                        </div>

                        <div>

                            <span>
                                CURRENT STATUS
                            </span>

                            <h2>
                                {getStatusLabel(
                                    parcel.status
                                )}
                            </h2>

                            <p>
                                Tracking number:{" "}
                                <strong>
                                    {
                                        parcel.trackingNumber
                                    }
                                </strong>
                            </p>

                        </div>

                    </div>

                    <div className="status-progress">

                        <div className="progress-header">

                            <span>
                                Delivery progress
                            </span>

                            <strong>
                                {progress}%
                            </strong>

                        </div>

                        <div className="track-progress">

                            <div
                                className="track-progress-fill"
                                style={{
                                    width: `${progress}%`
                                }}
                            ></div>

                            {progress > 0 && (
                                <div
                                    className="progress-truck"
                                    style={{
                                        left: `${Math.min(
                                            progress,
                                            96
                                        )}%`
                                    }}
                                >
                                    🚚
                                </div>
                            )}

                        </div>

                    </div>

                </section>

                {/* ================= JOURNEY STEPPER ================= */}

                <section className="journey-card">

                    <div className="section-heading">

                        <div>

                            <span>
                                DELIVERY JOURNEY
                            </span>

                            <h2>
                                Shipment progress
                            </h2>

                        </div>

                    </div>

                    {parcel.status === "CANCELLED" ? (

                        <div className="cancelled-journey">

                            <div>
                                ❌
                            </div>

                            <strong>
                                Shipment Cancelled
                            </strong>

                            <p>
                                This parcel is no longer
                                moving through the delivery
                                process.
                            </p>

                        </div>

                    ) : (

                        <div className="journey-stepper">

                            {journeySteps.map(
                                (step, index) => {

                                    const completed =
                                        index <=
                                        currentStepIndex;

                                    const active =
                                        index ===
                                        currentStepIndex;

                                    return (
                                        <div
                                            className="journey-item-wrapper"
                                            key={
                                                step.status
                                            }
                                        >

                                            <div
                                                className={`journey-item ${
                                                    completed
                                                        ? "completed"
                                                        : ""
                                                } ${
                                                    active
                                                        ? "active"
                                                        : ""
                                                }`}
                                            >

                                                <div className="journey-icon">
                                                    {completed
                                                        ? index <
                                                          currentStepIndex
                                                            ? "✓"
                                                            : step.icon
                                                        : index + 1}
                                                </div>

                                                <span>
                                                    {
                                                        step.label
                                                    }
                                                </span>

                                            </div>

                                            {index <
                                                journeySteps.length -
                                                    1 && (
                                                <div
                                                    className={`journey-line ${
                                                        index <
                                                        currentStepIndex
                                                            ? "completed"
                                                            : ""
                                                    }`}
                                                ></div>
                                            )}

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>

                {/* ================= ROUTE ================= */}

                <section className="route-card">

                    <div className="section-heading">

                        <div>

                            <span>
                                SHIPMENT ROUTE
                            </span>

                            <h2>
                                From pickup to destination
                            </h2>

                        </div>

                    </div>

                    <div className="route-container">

                        <div className="route-location">

                            <div className="route-marker pickup">
                                ●
                            </div>

                            <div>

                                <span>
                                    PICKUP LOCATION
                                </span>

                                <strong>
                                    {
                                        parcel.pickupAddress
                                    }
                                </strong>

                                <small>
                                    Sender:{" "}
                                    {
                                        parcel.senderName
                                    }
                                </small>

                            </div>

                        </div>

                        <div className="route-visual">

                            <div className="route-dashed"></div>

                            <div className="route-route-icon">
                                🚚
                            </div>

                        </div>

                        <div className="route-location">

                            <div className="route-marker destination">
                                ●
                            </div>

                            <div>

                                <span>
                                    DELIVERY DESTINATION
                                </span>

                                <strong>
                                    {
                                        parcel.deliveryAddress
                                    }
                                </strong>

                                <small>
                                    Receiver:{" "}
                                    {
                                        parcel.receiverName
                                    }
                                </small>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ================= TWO COLUMN ================= */}

                <div className="track-columns">

                    {/* TRACKING HISTORY */}

                    <section className="history-card">

                        <div className="section-heading">

                            <div>

                                <span>
                                    TRACKING HISTORY
                                </span>

                                <h2>
                                    Shipment activity
                                </h2>

                            </div>

                            <span className="history-count">
                                {sortedHistory.length}
                            </span>

                        </div>

                        {sortedHistory.length === 0 ? (

                            <div className="no-history">

                                <div>
                                    📍
                                </div>

                                <p>
                                    Tracking updates will
                                    appear here as your parcel
                                    moves through the delivery
                                    process.
                                </p>

                            </div>

                        ) : (

                            <div className="timeline">

                                {[
                                    ...sortedHistory
                                ]
                                    .reverse()
                                    .map(
                                        (
                                            item,
                                            index
                                        ) => (

                                            <div
                                                className="timeline-item"
                                                key={
                                                    item.id ||
                                                    `${item.status}-${index}`
                                                }
                                            >

                                                <div className="timeline-marker">

                                                    <div>
                                                        {getStatusIcon(
                                                            item.status
                                                        )}
                                                    </div>

                                                </div>

                                                <div className="timeline-content">

                                                    <div className="timeline-top">

                                                        <strong>
                                                            {getStatusLabel(
                                                                item.status
                                                            )}
                                                        </strong>

                                                        <span>
                                                            {
                                                                formatDate(
                                                                    item.updatedAt
                                                                )
                                                            }
                                                        </span>

                                                    </div>

                                                    <p>
                                                        {getTrackingDescription(
                                                            item.status
                                                        )}
                                                    </p>

                                                    <small>
                                                        {formatTime(
                                                            item.updatedAt
                                                        )}
                                                    </small>

                                                </div>

                                            </div>
                                        )
                                    )}

                            </div>
                        )}

                    </section>

                    {/* SMART TRACKING, QR AND ECO ESTIMATE */}
                    <section className="track-extras-grid">
                        <article className="track-extra-card track-qr-card">
                            <div className="track-extra-heading">
                                <div className="track-extra-icon">▦</div>
                                <div><span>QUICK ACCESS</span><h2>Scan to track</h2></div>
                            </div>
                            <div className="track-qr-content">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(`${window.location.origin}/track/${parcel.id}`)}`}
                                    alt={`QR code to track parcel ${parcel.trackingNumber}`}
                                    loading="lazy"
                                />
                                <div>
                                    <strong>{parcel.trackingNumber}</strong>
                                    <p>Scan this QR code to open this shipment's tracking page on a device that can access your ParcelHub site.</p>
                                    <div className="track-qr-actions">
                                        <button type="button" onClick={() => navigator.clipboard?.writeText(parcel.trackingNumber || "").then(() => window.alert("Tracking number copied."), () => window.alert("Copy failed. Please select the tracking number manually."))}>Copy tracking number</button>
                                        <button type="button" className="track-share-button" onClick={async () => {
                                            const trackingUrl = `${window.location.origin}/track/${parcel.id}`;
                                            try {
                                                if (navigator.share) await navigator.share({ title: "Track my ParcelHub shipment", text: `Track shipment ${parcel.trackingNumber}`, url: trackingUrl });
                                                else { await navigator.clipboard.writeText(trackingUrl); window.alert("Tracking link copied."); }
                                            } catch (error) {
                                                if (error?.name !== "AbortError") window.alert("Unable to share automatically. Copy this link from your browser address bar.");
                                            }
                                        }}>Share tracking link</button>
                                    </div>
                                </div>
                            </div>
                            <small className="track-qr-footnote">QR generation requires an internet connection. Localhost links work only on this computer unless your app is hosted or reachable on your network.</small>
                        </article>

                        <article className="track-extra-card track-eco-card">
                            <div className="track-extra-heading">
                                <div className="track-extra-icon eco">♧</div>
                                <div><span>PLANET CONSCIOUS</span><h2>Eco impact estimate</h2></div>
                            </div>
                            <div className="eco-metric">
                                <strong>{Number.isFinite(Number(parcel.distanceKm)) && parcel.distanceKm > 0 ? (Number(parcel.distanceKm) * 0.12).toFixed(2) : "—"}</strong>
                                <span>kg CO₂e estimated</span>
                            </div>
                            <div className="eco-distance-row"><span>Road distance</span><strong>{Number.isFinite(Number(parcel.distanceKm)) && parcel.distanceKm > 0 ? `${Number(parcel.distanceKm).toFixed(1)} km` : "Not available"}</strong></div>
                            <div className="eco-progress-track"><div style={{ width: `${Math.min(100, Math.max(0, Number(parcel.distanceKm || 0) / 20))}%` }} /></div>
                            <p>Illustrative estimate using 0.12 kg CO₂e per road kilometre. Actual emissions vary by vehicle, load, fuel, and route; this is not a measured footprint or a claim of emissions saved.</p>
                        </article>
                    </section>

                    {parcel.status === "DELIVERED" && parcel.deliveredTo && (
                        <section className="pod-receipt-card">
                            <div className="pod-receipt-check">✓</div>
                            <div className="pod-receipt-main">
                                <span>PROOF OF DELIVERY</span>
                                <h2>Shipment successfully delivered</h2>
                                <p>Received by <strong>{parcel.deliveredTo}</strong></p>
                                {parcel.deliveryProofNote && <p className="pod-receipt-note">“{parcel.deliveryProofNote}”</p>}
                                {parcel.deliveredAt && <small>Confirmed on {new Date(parcel.deliveredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>}
                            </div>
                            <span className="pod-receipt-badge">Verified in app</span>
                        </section>
                    )}

                    {/* PARCEL DETAILS */}

                    <section className="details-card">

                        <div className="section-heading">

                            <div>

                                <span>
                                    PARCEL INFORMATION
                                </span>

                                <h2>
                                    Shipment details
                                </h2>

                            </div>

                        </div>

                        <div className="detail-list">

                            <div className="detail-row">

                                <span>
                                    Tracking Number
                                </span>

                                <strong>
                                    {
                                        parcel.trackingNumber
                                    }
                                </strong>

                            </div>

                            <div className="detail-row">

                                <span>
                                    Parcel ID
                                </span>

                                <strong>
                                    #{parcel.id}
                                </strong>

                            </div>

                            <div className="detail-row">

                                <span>
                                    Sender
                                </span>

                                <strong>
                                    {
                                        parcel.senderName
                                    }
                                </strong>

                            </div>

                            <div className="detail-row">

                                <span>
                                    Receiver
                                </span>

                                <strong>
                                    {
                                        parcel.receiverName
                                    }
                                </strong>

                            </div>

                            <div className="detail-row">

                                <span>
                                    Current Status
                                </span>

                                <strong className="detail-status">
                                    <span></span>
                                    {getStatusLabel(
                                        parcel.status
                                    )}
                                </strong>

                            </div>

                        </div>

                        <div className="track-help">

                            <div>
                                ✨
                            </div>

                            <section>

                                <strong>
                                    Need help?
                                </strong>

                                <p>
                                    Ask ParcelHub AI about
                                    this shipment.
                                </p>

                                <button
                                    onClick={() =>
                                        navigate(
                                            "/ai-assistant"
                                        )
                                    }
                                >
                                    Ask ParcelHub AI →
                                </button>

                            </section>

                        </div>

                    </section>

                </div>

            </main>

        </div>
    );
}

function getTrackingDescription(status) {
    const descriptions = {
        BOOKED:
            "Your parcel has been successfully registered and is awaiting pickup.",

        PICKED_UP:
            "The delivery agent has collected your parcel from the pickup location.",

        IN_TRANSIT:
            "Your parcel is currently moving through the delivery network.",

        OUT_FOR_DELIVERY:
            "Your parcel is with the delivery agent and is on its way to the destination.",

        DELIVERED:
            "Your parcel has successfully reached its destination.",

        CANCELLED:
            "This shipment has been cancelled."
    };

    return (
        descriptions[status] ||
        "A new update was recorded for this shipment."
    );
}

export default TrackParcel;