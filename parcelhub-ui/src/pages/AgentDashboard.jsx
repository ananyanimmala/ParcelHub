
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AgentDashboard.css";

function AgentDashboard() {
    const navigate = useNavigate();

    const [parcels, setParcels] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [profileOpen, setProfileOpen] = useState(false);
    const [proofParcel, setProofParcel] = useState(null);
    const [proofRecipient, setProofRecipient] = useState("");
    const [proofNote, setProofNote] = useState("");
    const [proofSubmitting, setProofSubmitting] = useState(false);

    const name = localStorage.getItem("name") || "Delivery Agent";
    const email = localStorage.getItem("email") || "";
    const firstName = name.trim().split(/\s+/)[0] || "Agent";

    // Greeting changes according to the current time.
    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) return "Good morning";
        if (hour >= 12 && hour < 17) return "Good afternoon";
        if (hour >= 17 && hour < 21) return "Good evening";

        return "Good night";
    };

    // Normalize supported API response formats.
    const normalizeParcels = (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.content)) return data.content;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.parcels)) return data.parcels;
        if (Array.isArray(data?.data?.content)) return data.data.content;

        return [];
    };

    // Load delivery assignments.
    const fetchParcels = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);

            setError("");

            const response = await API.get("/parcels");
            setParcels(normalizeParcels(response.data));
        } catch (err) {
            console.error("Error loading agent parcels:", err);

            if (err.response?.status === 401) {
                localStorage.clear();
                navigate("/login", { replace: true });
                return;
            }

            if (err.response?.status === 403) {
                setError(
                    "Access denied. Your account cannot view these assignments."
                );
            } else {
                setError(
                    typeof err.response?.data === "string"
                        ? err.response.data
                        : "Unable to load delivery assignments. Please try again."
                );
            }
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchParcels();
    }, [fetchParcels]);

    // Logout.
    const handleLogout = () => {
        localStorage.clear();
        navigate("/login", { replace: true });
    };

    // Update shipment status using the existing backend endpoint.
    const updateStatus = async (id, status) => {
        if (updatingId !== null) return;

        // Delivery completion requires a recorded recipient, not just a status click.
        if (status === "DELIVERED") {
            const selected = parcels.find((item) => item.id === id);
            if (selected) {
                setProofParcel(selected);
                setProofRecipient(selected.receiverName || "");
                setProofNote("");
                setError("");
                setNotice("");
            }
            return;
        }

        const parcel = parcels.find((item) => item.id === id);

        if (!parcel) {
            setError("The selected parcel could not be found.");
            return;
        }

        if (getNextStatus(parcel.status) !== status) {
            setError(
                "This status transition is not available for the selected parcel."
            );
            return;
        }

        try {
            setUpdatingId(id);
            setError("");
            setNotice("");

            await API.patch(
                `/parcels/${id}/status`,
                null,
                { params: { status } }
            );

            // Update the UI immediately after a successful server response.
            setParcels((current) =>
                current.map((item) =>
                    item.id === id
                        ? { ...item, status }
                        : item
                )
            );

            setNotice(
                `Shipment ${
                    parcel.trackingNumber || `#${id}`
                } updated to ${getStatusLabel(status)}.`
            );

            // Refresh the server's authoritative data.
            await fetchParcels(false);
        } catch (err) {
            console.error("Status update error:", err);

            if (err.response?.status === 401) {
                localStorage.clear();
                navigate("/login", { replace: true });
                return;
            }

            setError(
                typeof err.response?.data === "string"
                    ? err.response.data
                    : "Unable to update the parcel status. Please try again."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const submitProofOfDelivery = async (event) => {
        event.preventDefault();
        if (!proofParcel || !proofRecipient.trim() || proofSubmitting) return;

        try {
            setProofSubmitting(true);
            setUpdatingId(proofParcel.id);
            setError("");
            setNotice("");
            await API.post(`/parcels/${proofParcel.id}/proof-of-delivery`, {
                deliveredTo: proofRecipient.trim(),
                note: proofNote.trim()
            });
            setNotice(`Delivery proof recorded for ${proofParcel.trackingNumber || `#${proofParcel.id}`}.`);
            setProofParcel(null);
            setProofRecipient("");
            setProofNote("");
            await fetchParcels(false);
        } catch (err) {
            console.error("Proof of delivery error:", err);
            setError(typeof err.response?.data === "string"
                ? err.response.data
                : "Unable to save proof of delivery. Please try again.");
        } finally {
            setProofSubmitting(false);
            setUpdatingId(null);
        }
    };

    // Statistics.
    const totalParcels = parcels.length;

    const pickedUp = parcels.filter(
        (parcel) => parcel.status === "PICKED_UP"
    ).length;

    const inTransit = parcels.filter(
        (parcel) => parcel.status === "IN_TRANSIT"
    ).length;

    const outForDelivery = parcels.filter(
        (parcel) => parcel.status === "OUT_FOR_DELIVERY"
    ).length;

    const delivered = parcels.filter(
        (parcel) => parcel.status === "DELIVERED"
    ).length;

    const activeDeliveries = pickedUp + inTransit + outForDelivery;

    const completionRate = totalParcels === 0
        ? 0
        : Math.round((delivered / totalParcels) * 100);

    // Search and status filtering.
    const filteredParcels = useMemo(() => {
        const searchText = search.toLowerCase().trim();

        return parcels.filter((parcel) => {
            const searchableValues = [
                parcel.trackingNumber,
                parcel.receiverName,
                parcel.senderName,
                parcel.deliveryAddress,
                parcel.pickupAddress
            ];

            const matchesSearch =
                !searchText ||
                searchableValues.some((value) =>
                    String(value || "")
                        .toLowerCase()
                        .includes(searchText)
                );

            const matchesFilter =
                filter === "ALL" || parcel.status === filter;

            return matchesSearch && matchesFilter;
        });
    }, [parcels, search, filter]);

    // Status labels.
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

    // Status icons.
    const getStatusIcon = (status) => {
        const icons = {
            BOOKED: "📋",
            PICKED_UP: "📦",
            IN_TRANSIT: "🚚",
            OUT_FOR_DELIVERY: "🛵",
            DELIVERED: "✓",
            CANCELLED: "✕"
        };

        return icons[status] || "📦";
    };

    // Delivery progress.
    const getProgress = (status) => {
        const progress = {
            BOOKED: 15,
            PICKED_UP: 35,
            IN_TRANSIT: 60,
            OUT_FOR_DELIVERY: 82,
            DELIVERED: 100,
            CANCELLED: 0
        };

        return progress[status] ?? 0;
    };

    // Allowed next status.
    const getNextStatus = (status) => {
        const next = {
            BOOKED: "PICKED_UP",
            PICKED_UP: "IN_TRANSIT",
            IN_TRANSIT: "OUT_FOR_DELIVERY",
            OUT_FOR_DELIVERY: "DELIVERED"
        };

        return next[status] || null;
    };

    const getNextStatusLabel = (status) => {
        const next = getNextStatus(status);

        if (!next) return "Completed";

        const labels = {
            PICKED_UP: "Mark Picked Up",
            IN_TRANSIT: "Start Transit",
            OUT_FOR_DELIVERY: "Out for Delivery",
            DELIVERED: "Mark Delivered"
        };

        return labels[next] || "Update Status";
    };

    const scrollToDeliveries = () => {
        document
            .querySelector(".delivery-section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const selectFilter = (value) => {
        setFilter(value);
        scrollToDeliveries();
    };

    return (
        <div className="agent-page">
            {/* SIDEBAR */}
            <aside className="agent-sidebar">
                <div className="agent-brand">
                    <div className="agent-brand-icon">📦</div>

                    <div>
                        <strong>ParcelHub</strong>
                        <span>Agent Operations</span>
                    </div>
                </div>

                <div className="agent-profile">
                    <div className="agent-avatar">
                        {name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <strong>{name}</strong>
                        <span>Delivery Agent</span>
                    </div>

                    <div className="online-dot"></div>
                </div>

                <nav className="agent-nav" aria-label="Agent navigation">
                    <button
                        className="agent-nav-item active"
                        onClick={() => {
                            setFilter("ALL");
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth"
                            });
                        }}
                    >
                        <span>▦</span>
                        Overview
                    </button>

                    <button
                        className="agent-nav-item"
                        onClick={() => {
                            setFilter("ALL");
                            scrollToDeliveries();
                        }}
                    >
                        <span>🚚</span>
                        My Deliveries
                        <b>{activeDeliveries}</b>
                    </button>

                    <button
                        className="agent-nav-item"
                        onClick={() => selectFilter("OUT_FOR_DELIVERY")}
                    >
                        <span>📍</span>
                        Out for Delivery
                    </button>

                    <button
                        className="agent-nav-item"
                        onClick={() => selectFilter("DELIVERED")}
                    >
                        <span>✓</span>
                        Completed
                    </button>
                </nav>

                <div className="agent-sidebar-bottom">
                    <div className="agent-sidebar-tip">
                        <span>✨</span>

                        <div>
                            <strong>Smart Delivery</strong>
                            <p>Keep every shipment moving smoothly.</p>
                        </div>
                    </div>

                    <button
                        className="agent-logout"
                        onClick={handleLogout}
                    >
                        <span>↪</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <main className="agent-main">
                {/* TOPBAR */}
                <header className="agent-topbar">
                    <div className="agent-mobile-brand">
                        📦 ParcelHub
                    </div>

                    <div className="agent-topbar-right">
                        <button
                            className="agent-notification"
                            title="Refresh assignments"
                            aria-label="Refresh assignments"
                            onClick={() => fetchParcels()}
                            disabled={loading}
                        >
                            ↻
                        </button>

                        <div className="agent-profile-wrapper">
                            <button
                                className="agent-top-profile"
                                onClick={() =>
                                    setProfileOpen((open) => !open)
                                }
                                aria-expanded={profileOpen}
                                aria-haspopup="true"
                            >
                                <div className="agent-top-avatar">
                                    {name.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                    <strong>{name}</strong>
                                    <span>Delivery Agent</span>
                                </div>

                                <b>{profileOpen ? "▴" : "▾"}</b>
                            </button>

                            {profileOpen && (
                                <div className="agent-profile-menu">
                                    <div className="agent-menu-user">
                                        <div className="agent-menu-avatar">
                                            {name.charAt(0).toUpperCase()}
                                        </div>

                                        <div>
                                            <strong>{name}</strong>
                                            <span>{email || "Agent account"}</span>
                                        </div>
                                    </div>

                                    <div className="agent-menu-line"></div>

                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            scrollToDeliveries();
                                        }}
                                    >
                                        🚚 My Deliveries
                                    </button>

                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            fetchParcels();
                                        }}
                                    >
                                        ↻ Refresh Assignments
                                    </button>

                                    <div className="agent-menu-line"></div>

                                    <button
                                        className="agent-menu-logout"
                                        onClick={handleLogout}
                                    >
                                        ↪ Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="agent-content">
                    {/* HERO */}
                    <section className="agent-hero">
                        <div>
                            <span className="agent-eyebrow">
                                AGENT OPERATIONS
                            </span>

                            <h1>
                                {getGreeting()}, {firstName} 👋
                            </h1>

                            <p>
                                Here's your delivery overview and current
                                shipment activity.
                            </p>
                        </div>

                        <div className="agent-live-card">
                            <div className="live-pulse">●</div>

                            <div>
                                <strong>Agent Dashboard</strong>
                                <span>Delivery operations overview</span>
                            </div>
                        </div>
                    </section>

                    {/* FEEDBACK */}
                    {error && (
                        <div className="agent-error" role="alert">
                            <span>⚠️ {error}</span>

                            <button
                                type="button"
                                onClick={() => fetchParcels()}
                                disabled={loading}
                            >
                                {loading ? "Retrying..." : "Retry"}
                            </button>
                        </div>
                    )}

                    {notice && (
                        <div className="agent-success" role="status">
                            <span>✓ {notice}</span>

                            <button
                                type="button"
                                onClick={() => setNotice("")}
                                aria-label="Dismiss success message"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* STAT CARDS */}
                    <section className="agent-stats">
                        <div className="agent-stat total">
                            <div className="agent-stat-icon">📦</div>

                            <div>
                                <span>Total Assignments</span>
                                <strong>{totalParcels}</strong>
                                <small>All available shipments</small>
                            </div>
                        </div>

                        <div className="agent-stat active">
                            <div className="agent-stat-icon">🚚</div>

                            <div>
                                <span>Active Deliveries</span>
                                <strong>{activeDeliveries}</strong>
                                <small>Pickups and ongoing deliveries</small>
                            </div>
                        </div>

                        <div className="agent-stat urgent">
                            <div className="agent-stat-icon">🛵</div>

                            <div>
                                <span>Out for Delivery</span>
                                <strong>{outForDelivery}</strong>
                                <small>Currently on the final stage</small>
                            </div>
                        </div>

                        <div className="agent-stat completed">
                            <div className="agent-stat-icon">✓</div>

                            <div>
                                <span>Completed</span>
                                <strong>{delivered}</strong>
                                <small>{completionRate}% of all parcels</small>
                            </div>
                        </div>
                    </section>

                    {/* PERFORMANCE AND QUICK ACTION */}
                    <section className="agent-overview-grid">
                        <div className="performance-card">
                            <div className="card-heading">
                                <div>
                                    <span>OVERALL SHIPMENT SUMMARY</span>
                                    <h2>Delivery progress</h2>
                                </div>

                                <div className="performance-percent">
                                    {completionRate}%
                                </div>
                            </div>

                            <div
                                className="big-progress"
                                role="progressbar"
                                aria-label="Delivery completion rate"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={completionRate}
                            >
                                <div
                                    style={{ width: `${completionRate}%` }}
                                ></div>
                            </div>

                            <div className="performance-footer">
                                <span>
                                    <b>{delivered}</b> delivered
                                </span>

                                <span>
                                    <b>{activeDeliveries}</b> active
                                </span>

                                <span>
                                    <b>{totalParcels}</b> total
                                </span>
                            </div>
                        </div>

                        <div className="quick-action-card">
                            <div className="quick-action-icon">⚡</div>

                            <div>
                                <span>QUICK ACTION</span>
                                <h3>Manage a delivery</h3>
                                <p>
                                    Find a shipment and update its status
                                    as it progresses.
                                </p>
                            </div>

                            <button onClick={scrollToDeliveries}>
                                View Deliveries →
                            </button>
                        </div>
                    </section>

                    {/* DELIVERY MANAGEMENT */}
                    <section className="delivery-section">
                        <div className="delivery-heading">
                            <div>
                                <span>DELIVERY MANAGEMENT</span>
                                <h2>My Deliveries</h2>
                                <p>
                                    Search shipments, view tracking history,
                                    and update delivery progress.
                                </p>
                            </div>

                            <div className="delivery-count">
                                {filteredParcels.length} shipments
                            </div>
                        </div>

                        {/* SEARCH AND FILTERS */}
                        <div className="agent-filters">
                            <div className="agent-search">
                                <span>🔎</span>

                                <input
                                    type="search"
                                    placeholder="Search tracking number, receiver or destination..."
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    aria-label="Search deliveries"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        aria-label="Clear search"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            <div className="agent-filter-buttons">
                                {[
                                    ["ALL", "All"],
                                    ["BOOKED", "Booked"],
                                    ["PICKED_UP", "Picked Up"],
                                    ["IN_TRANSIT", "In Transit"],
                                    ["OUT_FOR_DELIVERY", "Out for Delivery"],
                                    ["DELIVERED", "Delivered"],
                                    ["CANCELLED", "Cancelled"]
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={
                                            filter === value ? "active" : ""
                                        }
                                        aria-pressed={filter === value}
                                        onClick={() => setFilter(value)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* LOADING */}
                        {loading ? (
                            <div className="agent-loading" role="status">
                                <div></div>
                                <p>Loading delivery assignments...</p>
                            </div>
                        ) : filteredParcels.length === 0 ? (
                            /* EMPTY STATE */
                            <div className="agent-empty">
                                <div>📦</div>
                                <h3>No deliveries found</h3>

                                <p>
                                    {search || filter !== "ALL"
                                        ? "Try changing your search or selected status filter."
                                        : "There are currently no parcels available in the returned assignment list."}
                                </p>

                                {(search || filter !== "ALL") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setFilter("ALL");
                                        }}
                                    >
                                        Clear Search and Filters
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => fetchParcels()}
                                    disabled={loading}
                                >
                                    Refresh Assignments
                                </button>
                            </div>
                        ) : (
                            /* DELIVERY CARDS */
                            <div className="agent-delivery-list">
                                {filteredParcels.map((parcel) => {
                                    const nextStatus = getNextStatus(
                                        parcel.status
                                    );

                                    const isUpdating =
                                        updatingId === parcel.id;

                                    const statusClass = String(
                                        parcel.status || "unknown"
                                    )
                                        .toLowerCase()
                                        .replaceAll("_", "-");

                                    return (
                                        <article
                                            className="delivery-card"
                                            key={parcel.id}
                                        >
                                            {/* CARD HEADER */}
                                            <div className="delivery-card-top">
                                                <div className="delivery-id">
                                                    <div className="delivery-icon">
                                                        {getStatusIcon(
                                                            parcel.status
                                                        )}
                                                    </div>

                                                    <div>
                                                        <span>
                                                            TRACKING NUMBER
                                                        </span>

                                                        <strong>
                                                            {parcel.trackingNumber ||
                                                                `Parcel #${parcel.id}`}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`agent-status ${statusClass}`}
                                                >
                                                    {getStatusLabel(
                                                        parcel.status
                                                    )}
                                                </span>
                                            </div>

                                            {/* PICKUP AND DESTINATION */}
                                            <div className="delivery-route">
                                                <div className="delivery-location">
                                                    <div className="location-pin pickup">
                                                        ●
                                                    </div>

                                                    <div>
                                                        <span>PICKUP</span>

                                                        <strong>
                                                            {parcel.pickupAddress ||
                                                                "Address unavailable"}
                                                        </strong>

                                                        <small>
                                                            Sender:{" "}
                                                            {parcel.senderName ||
                                                                "Not provided"}
                                                        </small>
                                                    </div>
                                                </div>

                                                <div className="delivery-route-line">
                                                    <span>🚚</span>
                                                </div>

                                                <div className="delivery-location">
                                                    <div className="location-pin destination">
                                                        ●
                                                    </div>

                                                    <div>
                                                        <span>DESTINATION</span>

                                                        <strong>
                                                            {parcel.deliveryAddress ||
                                                                "Address unavailable"}
                                                        </strong>

                                                        <small>
                                                            Receiver:{" "}
                                                            {parcel.receiverName ||
                                                                "Not provided"}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* PROGRESS */}
                                            <div className="delivery-progress">
                                                <div className="delivery-progress-header">
                                                    <span>
                                                        Delivery progress
                                                    </span>

                                                    <strong>
                                                        {getProgress(
                                                            parcel.status
                                                        )}
                                                        %
                                                    </strong>
                                                </div>

                                                <div
                                                    className="delivery-progress-track"
                                                    role="progressbar"
                                                    aria-label={`Delivery progress for ${
                                                        parcel.trackingNumber ||
                                                        parcel.id
                                                    }`}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    aria-valuenow={getProgress(
                                                        parcel.status
                                                    )}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${getProgress(
                                                                parcel.status
                                                            )}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* ACTIONS */}
                                            <div className="delivery-actions">
                                                <div className="delivery-meta">
                                                    <span>
                                                        Parcel #{parcel.id}
                                                    </span>

                                                    <span>
                                                        Receiver:{" "}
                                                        {parcel.receiverName ||
                                                            "Not provided"}
                                                    </span>
                                                </div>

                                                <div className="delivery-buttons">
                                                    <button
                                                        type="button"
                                                        className="view-track-button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/track/${parcel.id}`
                                                            )
                                                        }
                                                    >
                                                        View Tracking
                                                    </button>

                                                    {nextStatus && (
                                                        <button
                                                            type="button"
                                                            className="update-status-button"
                                                            disabled={
                                                                updatingId !==
                                                                    null ||
                                                                isUpdating
                                                            }
                                                            onClick={() =>
                                                                updateStatus(
                                                                    parcel.id,
                                                                    nextStatus
                                                                )
                                                            }
                                                        >
                                                            {isUpdating
                                                                ? "Updating..."
                                                                : getNextStatusLabel(
                                                                    parcel.status
                                                                )}
                                                        </button>
                                                    )}

                                                    {!nextStatus &&
                                                        parcel.status ===
                                                            "DELIVERED" && (
                                                            <span className="delivery-completed-label">
                                                                ✓ Completed
                                                            </span>
                                                        )}

                                                    {parcel.status ===
                                                        "CANCELLED" && (
                                                        <span className="delivery-completed-label">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* FOOTER */}
                    <footer className="agent-footer">
                        <span>ParcelHub Agent Operations</span>
                        <span>
                            Smart Delivery Platform · 2026
                        </span>
                    </footer>
                </div>
            </main>

            {proofParcel && (
                <div className="pod-modal-backdrop" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !proofSubmitting) setProofParcel(null);
                }}>
                    <section className="pod-modal" role="dialog" aria-modal="true" aria-labelledby="pod-title">
                        <button className="pod-modal-close" type="button" aria-label="Close delivery confirmation" onClick={() => !proofSubmitting && setProofParcel(null)}>×</button>
                        <div className="pod-modal-icon">✓</div>
                        <span className="pod-eyebrow">FINAL DELIVERY STEP</span>
                        <h2 id="pod-title">Confirm delivery</h2>
                        <p className="pod-description">Record who received the parcel. This confirmation will appear on the shipment tracking page.</p>
                        <div className="pod-parcel-reference">
                            <span>Tracking number</span>
                            <strong>{proofParcel.trackingNumber || `#${proofParcel.id}`}</strong>
                        </div>
                        <form onSubmit={submitProofOfDelivery} className="pod-form">
                            <label htmlFor="pod-recipient">Received by <span>*</span></label>
                            <input id="pod-recipient" value={proofRecipient} onChange={(event) => setProofRecipient(event.target.value)} placeholder="Enter recipient's full name" required maxLength={120} autoFocus />
                            <label htmlFor="pod-note">Delivery note <small>(optional)</small></label>
                            <textarea id="pod-note" value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="e.g. Handed over at reception" rows={3} maxLength={1000} />
                            <div className="pod-notice">This records a recipient name and note; it does not capture a photo or signature.</div>
                            <div className="pod-form-actions">
                                <button type="button" className="pod-cancel" onClick={() => setProofParcel(null)} disabled={proofSubmitting}>Cancel</button>
                                <button type="submit" className="pod-confirm" disabled={proofSubmitting || !proofRecipient.trim()}>{proofSubmitting ? "Saving proof…" : "Confirm delivery ✓"}</button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}

export default AgentDashboard;
