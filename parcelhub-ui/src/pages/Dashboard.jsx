import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const notificationStorageKey = `parcelhub-notifications-read-${localStorage.getItem("email") || "guest"}`;
    const [readNotificationIds, setReadNotificationIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(notificationStorageKey) || "[]");
        } catch {
            return [];
        }
    });

    const [cancelParcel, setCancelParcel] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    const name =
        localStorage.getItem("name") || "Customer";

    const email =
        localStorage.getItem("email") || "";

    const firstName =
        name.split(" ")[0];


    // =====================================================
    // GREETING
    // =====================================================

    const getGreeting = () => {

        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return "Good morning";
        }

        if (hour >= 12 && hour < 17) {
            return "Good afternoon";
        }

        if (hour >= 17 && hour < 21) {
            return "Good evening";
        }

        return "Good night";
    };


    // =====================================================
    // STATUS
    // =====================================================

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
            DELIVERED: "✓",
            CANCELLED: "✕"
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


    // =====================================================
    // FORMATTERS
    // =====================================================

    const formatDate = (value) => {

        if (!value) {
            return "Not available";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Not available";
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


    const formatCurrency = (value) => {

        const amount = Number(value || 0);

        return `₹${amount.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )}`;
    };


    const formatPaymentMethod = (method) => {

        const methods = {
            UPI: "UPI",
            CARD: "Card",
            NET_BANKING: "Net Banking",
            CASH_ON_DELIVERY: "Cash on Delivery"
        };

        return methods[method]
            || method
            || "Not selected";
    };


    const formatPaymentStatus = (status) => {

        const statuses = {
            PENDING: "Pending",
            PAID: "Paid",
            FAILED: "Failed",
            REFUNDED: "Refunded"
        };

        return statuses[status]
            || status
            || "Pending";
    };


    const formatDeliveryType = (type) => {

        const types = {
            STANDARD: "Standard",
            EXPRESS: "Express"
        };

        return types[type]
            || type
            || "Standard";
    };


    // =====================================================
    // FETCH PARCELS
    // =====================================================

    const fetchParcels = async (showLoading = true) => {

        try {

            if (showLoading) setLoading(true);
            setError("");

            const response =
                await API.get("/parcels");

            setParcels(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (err) {

            console.error(
                "Dashboard error:",
                err
            );

            if (
                err.response?.status === 401
            ) {

                localStorage.clear();

                navigate("/login");

                return;
            }


            if (
                err.response?.status === 403
            ) {

                setError(
                    "You do not have permission to view these shipments."
                );

            } else {

                setError(
                    typeof err.response?.data === "string"
                        ? err.response.data
                        : "Unable to load your shipments. Please try again."
                );
            }

        } finally {

            if (showLoading) setLoading(false);
        }
    };


    useEffect(() => {

        fetchParcels();
        // Keep the notification center reasonably fresh while the dashboard is open.
        const refreshTimer = setInterval(() => fetchParcels(false), 60000);
        return () => clearInterval(refreshTimer);

    }, []);


    const notifications = useMemo(() => {
        const statusCopy = {
            BOOKED: { title: "Shipment booked", message: "Your shipment has been booked and is awaiting pickup.", icon: "📋" },
            PICKED_UP: { title: "Parcel picked up", message: "Your parcel has been collected by the delivery team.", icon: "📦" },
            IN_TRANSIT: { title: "Parcel in transit", message: "Your parcel is moving through the delivery network.", icon: "🚚" },
            OUT_FOR_DELIVERY: { title: "Out for delivery", message: "Your parcel is on its final delivery route.", icon: "🛵" },
            DELIVERED: { title: "Parcel delivered", message: "Your shipment has been marked as delivered.", icon: "✅" },
            CANCELLED: { title: "Shipment cancelled", message: "This shipment has been cancelled.", icon: "✕" }
        };

        const paymentCopy = {
            PAID: { title: "Payment successful", message: "The demo payment is marked as paid.", icon: "💳" },
            PENDING: { title: "Payment pending", message: "Payment is still pending. If you selected cash on delivery, pay when the parcel arrives.", icon: "🧾" },
            FAILED: { title: "Payment unsuccessful", message: "Payment was not completed. Review the payment status before proceeding.", icon: "⚠️" },
            REFUNDED: { title: "Payment refunded", message: "The payment status is marked as refunded.", icon: "↩️" }
        };

        return parcels.slice().reverse().flatMap((parcel) => {
            const tracking = parcel.trackingNumber || `#${parcel.id}`;
            const status = statusCopy[parcel.status] || { title: "Shipment update", message: `Shipment status: ${parcel.status || "Unknown"}.`, icon: "📦" };
            const payment = paymentCopy[parcel.paymentStatus] || paymentCopy.PENDING;
            return [
                { id: `parcel-${parcel.id}-status-${parcel.status || "unknown"}`, parcelId: parcel.id, tracking, kind: "status", title: status.title, message: status.message, icon: status.icon, status: parcel.status },
                { id: `parcel-${parcel.id}-payment-${parcel.paymentStatus || "PENDING"}`, parcelId: parcel.id, tracking, kind: "payment", title: payment.title, message: payment.message, icon: payment.icon, status: parcel.paymentStatus || "PENDING" }
            ];
        });
    }, [parcels]);

    const unreadNotificationCount = notifications.filter((item) => !readNotificationIds.includes(item.id)).length;

    const markAllNotificationsRead = () => {
        const ids = notifications.map((item) => item.id);
        setReadNotificationIds(ids);
        localStorage.setItem(notificationStorageKey, JSON.stringify(ids));
    };

    const openNotification = (item) => {
        const nextReadIds = Array.from(new Set([...readNotificationIds, item.id]));
        setReadNotificationIds(nextReadIds);
        localStorage.setItem(notificationStorageKey, JSON.stringify(nextReadIds));
        setNotificationsOpen(false);
        navigate(`/track/${item.parcelId}`);
    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        localStorage.clear();

        navigate("/login");
    };


    // =====================================================
    // CANCEL PARCEL
    // =====================================================

    const handleCancelParcel = async () => {

        if (!cancelParcel) {
            return;
        }

        try {

            setCancelling(true);

            await API.patch(
                `/parcels/${cancelParcel.id}/cancel`
            );

            setCancelParcel(null);

            await fetchParcels();

        } catch (err) {

            console.error(
                "Cancel parcel error:",
                err
            );

            const message =
                err.response?.data;

            alert(
                typeof message === "string"
                    ? message
                    : "Unable to cancel this parcel."
            );

        } finally {

            setCancelling(false);
        }
    };


    // =====================================================
    // FILTER
    // =====================================================

    const filteredParcels = useMemo(() => {

        return parcels.filter(
            (parcel) => {

                const value =
                    search
                        .toLowerCase()
                        .trim();


                const matchesSearch =
                    !value
                    ||
                    parcel.trackingNumber
                        ?.toLowerCase()
                        .includes(value)
                    ||
                    parcel.senderName
                        ?.toLowerCase()
                        .includes(value)
                    ||
                    parcel.receiverName
                        ?.toLowerCase()
                        .includes(value)
                    ||
                    parcel.deliveryAddress
                        ?.toLowerCase()
                        .includes(value);


                const matchesStatus =
                    statusFilter === "ALL"
                    ||
                    parcel.status === statusFilter;


                return (
                    matchesSearch
                    &&
                    matchesStatus
                );
            }
        );

    }, [
        parcels,
        search,
        statusFilter
    ]);


    // =====================================================
    // STATISTICS
    // =====================================================

    const totalShipments =
        parcels.length;


    const inTransit =
        parcels.filter(
            (parcel) =>
                parcel.status === "PICKED_UP"
                ||
                parcel.status === "IN_TRANSIT"
                ||
                parcel.status === "OUT_FOR_DELIVERY"
        ).length;


    const delivered =
        parcels.filter(
            (parcel) =>
                parcel.status === "DELIVERED"
        ).length;


    const pending =
        parcels.filter(
            (parcel) =>
                parcel.status === "BOOKED"
        ).length;


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="dashboard-page loading-page">

                <div className="dashboard-loader">

                    <div className="loader-box">
                        📦
                    </div>

                    <div className="loader-spinner"></div>

                    <h2>
                        Loading your shipments
                    </h2>

                    <p>
                        We're getting your latest
                        delivery information...
                    </p>

                </div>

            </div>
        );
    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (
            <div className="dashboard-page">

                <div className="dashboard-error-page">

                    <div className="dashboard-error-card">

                        <div className="error-icon">
                            ⚠️
                        </div>

                        <h2>
                            Something went wrong
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            className="retry-button"
                            onClick={fetchParcels}
                        >
                            Try Again
                        </button>

                    </div>

                </div>

            </div>
        );
    }


    return (
        <div className="dashboard-page">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="dashboard-sidebar">

                <div className="sidebar-brand">

                    <div className="sidebar-brand-icon">
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


                <nav className="sidebar-navigation">

                    <button
                        className="sidebar-nav active"
                    >
                        <span>▦</span>
                        Dashboard
                    </button>


                    <button
                        className="sidebar-nav"
                        onClick={() =>
                            navigate(
                                "/create-parcel"
                            )
                        }
                    >
                        <span>＋</span>
                        Create Parcel
                    </button>


                    <button
                        className="sidebar-nav"
                        onClick={() =>
                            document
                                .getElementById(
                                    "shipments-section"
                                )
                                ?.scrollIntoView({
                                    behavior: "smooth"
                                })
                        }
                    >
                        <span>◎</span>
                        My Shipments
                    </button>


                    <button
                        className="sidebar-nav"
                        onClick={() =>
                            navigate(
                                "/ai-assistant"
                            )
                        }
                    >
                        <span>✦</span>
                        ParcelHub AI
                    </button>

                </nav>


                <div className="sidebar-bottom">

                    <div className="sidebar-profile">

                        <div className="sidebar-avatar">
                            {name
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>

                            <strong>
                                {name}
                            </strong>

                            <span>
                                Customer
                            </span>

                        </div>

                    </div>


                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <span>↪</span>
                        Logout
                    </button>

                </div>

            </aside>


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="dashboard-content">

                {/* TOPBAR */}

                <header className="dashboard-topbar">

                    <div></div>

                    <div className="topbar-actions">

                        <div className="notification-wrapper">
                            <button
                                className={`notification-button ${notificationsOpen ? "is-open" : ""}`}
                                type="button"
                                aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
                                aria-expanded={notificationsOpen}
                                onClick={() => setNotificationsOpen((open) => !open)}
                            >
                                🔔
                                {unreadNotificationCount > 0 && <span className="notification-count">{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</span>}
                            </button>

                            {notificationsOpen && (
                                <section className="notification-panel" aria-label="Notification center">
                                    <div className="notification-panel-header">
                                        <div>
                                            <p className="notification-eyebrow">PARCELHUB UPDATES</p>
                                            <h2>Notifications</h2>
                                            <span>{unreadNotificationCount ? `${unreadNotificationCount} unread updates` : "You're all caught up"}</span>
                                        </div>
                                        <button type="button" className="notification-close" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}>×</button>
                                    </div>
                                    <div className="notification-toolbar">
                                        <span>Shipment and payment activity</span>
                                        <button type="button" onClick={markAllNotificationsRead} disabled={unreadNotificationCount === 0}>Mark all read</button>
                                    </div>
                                    <div className="notification-list">
                                        {loading && notifications.length === 0 ? (
                                            <div className="notification-empty">Loading your updates…</div>
                                        ) : notifications.length === 0 ? (
                                            <div className="notification-empty">
                                                <span>📭</span>
                                                <strong>No updates yet</strong>
                                                <p>Book a shipment to see delivery and payment updates here.</p>
                                            </div>
                                        ) : notifications.map((item) => (
                                            <button type="button" className={`notification-item ${readNotificationIds.includes(item.id) ? "is-read" : "is-unread"}`} key={item.id} onClick={() => openNotification(item)}>
                                                <span className={`notification-item-icon ${item.kind}`}>{item.icon}</span>
                                                <span className="notification-item-copy">
                                                    <strong>{item.title}</strong>
                                                    <span>{item.message}</span>
                                                    <small>{item.tracking} · {item.kind === "payment" ? "Payment" : "Delivery status"}</small>
                                                </span>
                                                {!readNotificationIds.includes(item.id) && <span className="notification-unread-dot" aria-label="Unread" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="notification-panel-footer">
                                        <span>Auto-refreshes every minute while this page is open.</span>
                                        <button type="button" onClick={() => fetchParcels(false)}>Refresh</button>
                                    </div>
                                </section>
                            )}
                        </div>


                        <div className="profile-wrapper">

                            <button
                                className="profile-button"
                                onClick={() =>
                                    setProfileOpen(
                                        !profileOpen
                                    )
                                }
                            >

                                <div className="profile-avatar">
                                    {name
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="profile-info">

                                    <strong>
                                        {name.toUpperCase()}
                                    </strong>

                                    <span>
                                        CUSTOMER
                                    </span>

                                </div>

                                <span className="profile-arrow">
                                    {profileOpen
                                        ? "⌃"
                                        : "⌄"}
                                </span>

                            </button>


                            {profileOpen && (

                                <div className="profile-dropdown">

                                    <div className="dropdown-user">

                                        <div className="dropdown-avatar">
                                            {name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div>

                                            <strong>
                                                {name}
                                            </strong>

                                            <span>
                                                {email}
                                            </span>

                                        </div>

                                    </div>


                                    <div className="dropdown-divider"></div>


                                    <button>
                                        👤 My Profile
                                    </button>

                                    <button>
                                        🔔 Notifications
                                    </button>


                                    <div className="dropdown-divider"></div>


                                    <button
                                        className="dropdown-logout"
                                        onClick={
                                            handleLogout
                                        }
                                    >
                                        ↪ Logout
                                    </button>

                                </div>
                            )}

                        </div>

                    </div>

                </header>


                {/* HERO */}

                <section className="dashboard-hero">

                    <div>

                        <span className="dashboard-eyebrow">
                            CUSTOMER PORTAL
                        </span>

                        <h1>
                            {getGreeting()},
                            {" "}
                            {firstName} 👋
                        </h1>

                        <p>
                            Track your shipments and
                            manage your deliveries
                            effortlessly.
                        </p>

                    </div>


                    <button
                        className="create-parcel-button"
                        onClick={() =>
                            navigate(
                                "/create-parcel"
                            )
                        }
                    >
                        <span>＋</span>
                        Create New Parcel
                    </button>

                </section>


                {/* STATS */}

                <section className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-icon purple">
                            📦
                        </div>

                        <div>

                            <span>
                                Total Shipments
                            </span>

                            <strong>
                                {totalShipments}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon orange">
                            🚚
                        </div>

                        <div>

                            <span>
                                In Transit
                            </span>

                            <strong>
                                {inTransit}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon green">
                            ✓
                        </div>

                        <div>

                            <span>
                                Delivered
                            </span>

                            <strong>
                                {delivered}
                            </strong>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon blue">
                            ⏳
                        </div>

                        <div>

                            <span>
                                Pending
                            </span>

                            <strong>
                                {pending}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* SHIPMENTS */}

                <section
                    className="shipments-section"
                    id="shipments-section"
                >

                    <div className="shipments-heading">

                        <div>

                            <span>
                                YOUR DELIVERY ACTIVITY
                            </span>

                            <h2>
                                My Shipments
                            </h2>

                            <p>
                                View and track all your
                                recent parcels.
                            </p>

                        </div>


                        <div className="shipment-count">

                            {filteredParcels.length}

                            <span>
                                {
                                    filteredParcels.length === 1
                                        ? " shipment"
                                        : " shipments"
                                }
                            </span>

                        </div>

                    </div>


                    {/* CONTROLS */}

                    <div className="shipment-controls">

                        <div className="search-box">

                            <span>
                                🔎
                            </span>

                            <input
                                type="text"
                                placeholder="Search tracking number, receiver or destination..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />


                            {search && (

                                <button
                                    onClick={() =>
                                        setSearch("")
                                    }
                                >
                                    ×
                                </button>

                            )}

                        </div>


                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                        >

                            <option value="ALL">
                                All Status
                            </option>

                            <option value="BOOKED">
                                Booked
                            </option>

                            <option value="PICKED_UP">
                                Picked Up
                            </option>

                            <option value="IN_TRANSIT">
                                In Transit
                            </option>

                            <option value="OUT_FOR_DELIVERY">
                                Out for Delivery
                            </option>

                            <option value="DELIVERED">
                                Delivered
                            </option>

                            <option value="CANCELLED">
                                Cancelled
                            </option>

                        </select>

                    </div>


                    {/* EMPTY */}

                    {filteredParcels.length === 0 ? (

                        <div className="empty-shipments">

                            <div className="empty-icon">
                                📦
                            </div>

                            <h3>
                                No shipments found
                            </h3>

                            <p>
                                {search ||
                                statusFilter !== "ALL"
                                    ? "Try changing your search or filter."
                                    : "Create your first parcel to start tracking deliveries."
                                }
                            </p>


                            {!search &&
                                statusFilter === "ALL" && (

                                    <button
                                        onClick={() =>
                                            navigate(
                                                "/create-parcel"
                                            )
                                        }
                                    >
                                        Create Your First
                                        Parcel →
                                    </button>

                                )}

                        </div>

                    ) : (

                        <div className="parcel-grid">

                            {filteredParcels.map(
                                (parcel, index) => {

                                    const progress =
                                        getProgress(
                                            parcel.status
                                        );


                                    const canCancel =
                                        parcel.status !==
                                            "DELIVERED"
                                        &&
                                        parcel.status !==
                                            "CANCELLED";


                                    return (

                                        <article
                                            className="parcel-card"
                                            key={parcel.id}
                                            style={{
                                                animationDelay:
                                                    `${index * 0.07}s`
                                            }}
                                        >

                                            {/* HEADER */}

                                            <div className="parcel-card-header">

                                                <div className="tracking-block">

                                                    <div
                                                        className={`parcel-status-icon ${parcel.status?.toLowerCase()}`}
                                                    >
                                                        {getStatusIcon(
                                                            parcel.status
                                                        )}
                                                    </div>


                                                    <div>

                                                        <span>
                                                            TRACKING NUMBER
                                                        </span>

                                                        <strong>
                                                            {
                                                                parcel.trackingNumber
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>


                                                <div
                                                    className={`status-badge ${parcel.status?.toLowerCase()}`}
                                                >
                                                    {
                                                        getStatusLabel(
                                                            parcel.status
                                                        )
                                                    }
                                                </div>

                                            </div>


                                            {/* ROUTE */}

                                            <div className="parcel-route">

                                                <div className="route-point">

                                                    <span>
                                                        FROM
                                                    </span>

                                                    <strong>
                                                        {
                                                            parcel.senderName
                                                        }
                                                    </strong>

                                                    <p>
                                                        {
                                                            parcel.pickupAddress
                                                        }
                                                    </p>

                                                </div>


                                                <div className="route-middle">

                                                    <div className="route-line"></div>

                                                    <div className="route-truck">
                                                        🚚
                                                    </div>

                                                </div>


                                                <div className="route-point destination">

                                                    <span>
                                                        TO
                                                    </span>

                                                    <strong>
                                                        {
                                                            parcel.receiverName
                                                        }
                                                    </strong>

                                                    <p>
                                                        {
                                                            parcel.deliveryAddress
                                                        }
                                                    </p>

                                                </div>

                                            </div>


                                            {/* PROGRESS */}

                                            <div className="parcel-progress-section">

                                                <div className="progress-header">

                                                    <span>
                                                        Delivery Progress
                                                    </span>

                                                    <strong>
                                                        {progress}%
                                                    </strong>

                                                </div>


                                                <div className="parcel-progress">

                                                    <div
                                                        className={`parcel-progress-fill ${
                                                            parcel.status ===
                                                            "CANCELLED"
                                                                ? "cancelled"
                                                                : ""
                                                        }`}
                                                        style={{
                                                            width:
                                                                `${progress}%`
                                                        }}
                                                    ></div>

                                                </div>

                                            </div>


                                            {/* DETAILS */}

                                            <div className="parcel-details-grid">

                                                <div>

                                                    <span>
                                                        DELIVERY
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatDeliveryType(
                                                                parcel.deliveryType
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        ESTIMATED
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatDate(
                                                                parcel.estimatedDeliveryDate
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        PAYMENT
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatPaymentMethod(
                                                                parcel.paymentMethod
                                                            )
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        CHARGE
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatCurrency(
                                                                parcel.deliveryCharge
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* PAYMENT STATUS */}

                                            <div className="payment-status-row">

                                                <span>
                                                    Payment Status
                                                </span>

                                                <strong
                                                    className={
                                                        parcel
                                                            .paymentStatus
                                                            ?.toLowerCase()
                                                    }
                                                >

                                                    <i></i>

                                                    {
                                                        formatPaymentStatus(
                                                            parcel.paymentStatus
                                                        )
                                                    }

                                                </strong>

                                            </div>


                                            {/* ACTIONS */}

                                            <div className="parcel-actions">

                                                <button
                                                    className="track-button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/track/${parcel.id}`
                                                        )
                                                    }
                                                >
                                                    Track Shipment
                                                    <span>
                                                        →
                                                    </span>
                                                </button>


                                                {canCancel && (

                                                    <button
                                                        className="cancel-button"
                                                        onClick={() =>
                                                            setCancelParcel(
                                                                parcel
                                                            )
                                                        }
                                                    >
                                                        Cancel
                                                    </button>

                                                )}

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>


                {/* AI */}

                <section className="dashboard-ai-card">

                    <div className="ai-card-icon">
                        ✦
                    </div>


                    <div>

                        <span>
                            PARCELHUB AI
                        </span>

                        <h3>
                            Need help with a shipment?
                        </h3>

                        <p>
                            Ask our AI assistant about
                            tracking, delivery information
                            and parcel support.
                        </p>

                    </div>


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


                <footer className="dashboard-footer">
                    © 2026 ParcelHub · Smart Delivery Platform
                </footer>


                {/* =================================================
                    CANCEL MODAL
                ================================================= */}

                {cancelParcel && (

                    <div
                        className="cancel-modal-overlay"
                        onClick={() => {

                            if (!cancelling) {
                                setCancelParcel(null);
                            }

                        }}
                    >

                        <div
                            className="cancel-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="cancel-modal-icon">
                                ⚠️
                            </div>


                            <span className="cancel-modal-label">
                                CANCEL SHIPMENT
                            </span>


                            <h2>
                                Cancel this parcel?
                            </h2>


                            <p>

                                Are you sure you want to
                                cancel shipment

                                <strong>
                                    {" "}
                                    {
                                        cancelParcel.trackingNumber
                                    }
                                </strong>
                                ?

                            </p>


                            <div className="cancel-warning">

                                <span>
                                    !
                                </span>


                                <div>

                                    <strong>
                                        This action will update
                                        the shipment status.
                                    </strong>

                                    <p>
                                        The cancellation will
                                        also appear in your
                                        tracking history.
                                    </p>

                                </div>

                            </div>


                            <div className="cancel-modal-actions">

                                <button
                                    className="keep-parcel-button"
                                    onClick={() =>
                                        setCancelParcel(
                                            null
                                        )
                                    }
                                    disabled={cancelling}
                                >
                                    Keep Parcel
                                </button>


                                <button
                                    className="confirm-cancel-button"
                                    onClick={
                                        handleCancelParcel
                                    }
                                    disabled={cancelling}
                                >
                                    {cancelling
                                        ? "Cancelling..."
                                        : "Yes, Cancel Parcel"
                                    }
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </main>

        </div>
    );
}

export default Dashboard;