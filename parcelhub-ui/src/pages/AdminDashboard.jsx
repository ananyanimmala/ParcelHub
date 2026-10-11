import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [parcels, setParcels] = useState([]);
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    const [activeSection, setActiveSection] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [parcelFilter, setParcelFilter] = useState("ALL");
    const [userFilter, setUserFilter] = useState("ALL");
    const [profileOpen, setProfileOpen] = useState(false);

    const name = localStorage.getItem("name") || "Administrator";
    const email = localStorage.getItem("email") || "admin@parcelhub.com";

    const statusLabels = {
        BOOKED: "Booked",
        PICKED_UP: "Picked Up",
        IN_TRANSIT: "In Transit",
        OUT_FOR_DELIVERY: "Out for Delivery",
        DELIVERED: "Delivered",
        CANCELLED: "Cancelled"
    };

    const statusIcons = {
        BOOKED: "📋",
        PICKED_UP: "📦",
        IN_TRANSIT: "🚚",
        OUT_FOR_DELIVERY: "🛵",
        DELIVERED: "✓",
        CANCELLED: "×"
    };

    const statusColors = {
        BOOKED: "blue",
        PICKED_UP: "purple",
        IN_TRANSIT: "orange",
        OUT_FOR_DELIVERY: "pink",
        DELIVERED: "green",
        CANCELLED: "red"
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [parcelResponse, userResponse] = await Promise.all([
                API.get("/parcels"),
                API.get("/users")
            ]);

            setParcels(parcelResponse.data || []);
            setUsers(userResponse.data || []);
        } catch (err) {
            console.error("Admin dashboard error:", err);

            if (err.response?.status === 403) {
                setError("You do not have permission to access the admin dashboard.");
            } else {
                setError("Unable to load admin dashboard data.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("role");

        navigate("/login");
    };

    const updateParcelStatus = async (parcelId, status) => {
        try {
            setActionLoading(`parcel-${parcelId}`);

            await API.patch(
                `/parcels/${parcelId}/status?status=${status}`
            );

            await fetchData();
        } catch (err) {
            console.error("Status update error:", err);
            alert("Unable to update parcel status.");
        } finally {
            setActionLoading("");
        }
    };

    const deleteParcel = async (parcelId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this parcel?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(`delete-parcel-${parcelId}`);

            await API.delete(`/parcels/${parcelId}`);

            setParcels((current) =>
                current.filter((parcel) => parcel.id !== parcelId)
            );
        } catch (err) {
            console.error("Delete parcel error:", err);
            alert("Unable to delete parcel.");
        } finally {
            setActionLoading("");
        }
    };

    const updateUserRole = async (userId, role) => {
        try {
            setActionLoading(`user-${userId}`);

            await API.patch(
                `/users/${userId}/role?role=${role}`
            );

            await fetchData();
        } catch (err) {
            console.error("Role update error:", err);
            alert("Unable to update user role.");
        } finally {
            setActionLoading("");
        }
    };

    const deleteUser = async (userId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this user?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(`delete-user-${userId}`);

            await API.delete(`/users/${userId}`);

            setUsers((current) =>
                current.filter((user) => user.id !== userId)
            );
        } catch (err) {
            console.error("Delete user error:", err);
            alert("Unable to delete user.");
        } finally {
            setActionLoading("");
        }
    };

    const statistics = useMemo(() => {
        const total = parcels.length;

        const delivered = parcels.filter(
            (parcel) => parcel.status === "DELIVERED"
        ).length;

        const inTransit = parcels.filter(
            (parcel) =>
                parcel.status === "IN_TRANSIT" ||
                parcel.status === "PICKED_UP"
        ).length;

        const outForDelivery = parcels.filter(
            (parcel) => parcel.status === "OUT_FOR_DELIVERY"
        ).length;

        const pending = parcels.filter(
            (parcel) => parcel.status === "BOOKED"
        ).length;

        const cancelled = parcels.filter(
            (parcel) => parcel.status === "CANCELLED"
        ).length;

        const deliveryRate =
            total > 0 ? Math.round((delivered / total) * 100) : 0;

        return {
            total,
            delivered,
            inTransit,
            outForDelivery,
            pending,
            cancelled,
            deliveryRate
        };
    }, [parcels]);

    const roleStatistics = useMemo(() => {
        return {
            customers: users.filter(
                (user) => user.role === "CUSTOMER"
            ).length,

            agents: users.filter(
                (user) => user.role === "DELIVERY_AGENT"
            ).length,

            admins: users.filter(
                (user) => user.role === "ADMIN"
            ).length
        };
    }, [users]);

    const filteredParcels = useMemo(() => {
        return parcels.filter((parcel) => {
            const matchesFilter =
                parcelFilter === "ALL" ||
                parcel.status === parcelFilter;

            const term = searchTerm.toLowerCase();

            const matchesSearch =
                !term ||
                String(parcel.trackingNumber || "")
                    .toLowerCase()
                    .includes(term) ||
                String(parcel.senderName || "")
                    .toLowerCase()
                    .includes(term) ||
                String(parcel.receiverName || "")
                    .toLowerCase()
                    .includes(term) ||
                String(parcel.deliveryAddress || "")
                    .toLowerCase()
                    .includes(term);

            return matchesFilter && matchesSearch;
        });
    }, [parcels, parcelFilter, searchTerm]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesFilter =
                userFilter === "ALL" ||
                user.role === userFilter;

            const term = searchTerm.toLowerCase();

            const matchesSearch =
                !term ||
                String(user.name || "")
                    .toLowerCase()
                    .includes(term) ||
                String(user.email || "")
                    .toLowerCase()
                    .includes(term);

            return matchesFilter && matchesSearch;
        });
    }, [users, userFilter, searchTerm]);

    const recentActivity = useMemo(() => {
        return [...parcels]
            .slice(-6)
            .reverse()
            .map((parcel) => ({
                id: parcel.id,
                trackingNumber: parcel.trackingNumber,
                status: parcel.status,
                receiver: parcel.receiverName
            }));
    }, [parcels]);

    if (loading) {
        return (
            <div className="admin-page admin-loading-page">
                <div className="admin-loader">
                    <div className="admin-loader-logo">📦</div>
                    <div className="admin-spinner"></div>
                    <h2>Loading Command Center</h2>
                    <p>Preparing your ParcelHub operations dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-page">
                <div className="admin-error-card">
                    <div className="admin-error-icon">⚠️</div>
                    <h1>Dashboard unavailable</h1>
                    <p>{error}</p>

                    <button onClick={() => navigate("/login")}>
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">

            {/* SIDEBAR */}

            <aside className="admin-sidebar">

                <div className="admin-brand">
                    <div className="admin-brand-icon">
                        📦
                    </div>

                    <div>
                        <strong>ParcelHub</strong>
                        <span>Command Center</span>
                    </div>
                </div>

                <div className="admin-profile-mini">
                    <div className="admin-avatar">
                        {name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                        <strong>{name}</strong>
                        <span>System Administrator</span>
                    </div>

                    <div className="online-dot"></div>
                </div>

                <nav className="admin-nav">

                    <button
                        className={
                            activeSection === "overview"
                                ? "active"
                                : ""
                        }
                        onClick={() => setActiveSection("overview")}
                    >
                        <span>⌂</span>
                        <div>
                            <strong>Overview</strong>
                            <small>System analytics</small>
                        </div>
                    </button>

                    <button
                        className={
                            activeSection === "shipments"
                                ? "active"
                                : ""
                        }
                        onClick={() => setActiveSection("shipments")}
                    >
                        <span>▣</span>
                        <div>
                            <strong>Shipments</strong>
                            <small>Manage parcels</small>
                        </div>

                        <em>{parcels.length}</em>
                    </button>

                    <button
                        className={
                            activeSection === "users"
                                ? "active"
                                : ""
                        }
                        onClick={() => setActiveSection("users")}
                    >
                        <span>♙</span>
                        <div>
                            <strong>Users</strong>
                            <small>Accounts & roles</small>
                        </div>

                        <em>{users.length}</em>
                    </button>

                    <button
                        className={
                            activeSection === "activity"
                                ? "active"
                                : ""
                        }
                        onClick={() => setActiveSection("activity")}
                    >
                        <span>◷</span>
                        <div>
                            <strong>Activity</strong>
                            <small>Recent operations</small>
                        </div>
                    </button>

                </nav>

                <div className="admin-sidebar-bottom">

                    <div className="system-status">
                        <span className="system-status-dot"></span>

                        <div>
                            <strong>System Online</strong>
                            <small>All services operational</small>
                        </div>
                    </div>

                    <button
                        className="admin-logout"
                        onClick={handleLogout}
                    >
                        <span>↪</span>
                        Logout
                    </button>

                </div>

            </aside>


            {/* MAIN */}

            <main className="admin-main">

                {/* TOPBAR */}

                <header className="admin-topbar">

                    <div className="admin-breadcrumb">
                        <span>ParcelHub</span>
                        <b>/</b>
                        <strong>
                            {activeSection === "overview"
                                ? "Overview"
                                : activeSection === "shipments"
                                    ? "Shipments"
                                    : activeSection === "users"
                                        ? "Users"
                                        : "Activity"}
                        </strong>
                    </div>

                    <div className="admin-top-actions">

                        <button
                            className="admin-refresh"
                            onClick={fetchData}
                            title="Refresh dashboard"
                        >
                            ↻
                        </button>

                        <button className="admin-notification">
                            ♢
                            <span></span>
                        </button>

                        <div className="admin-profile-wrapper">

                            <button
                                className="admin-top-profile"
                                onClick={() =>
                                    setProfileOpen(!profileOpen)
                                }
                            >
                                <div className="admin-top-avatar">
                                    {name.charAt(0).toUpperCase()}
                                </div>

                                <div>
                                    <strong>{name}</strong>
                                    <small>Administrator</small>
                                </div>

                                <span>⌄</span>
                            </button>

                            {profileOpen && (
                                <div className="admin-profile-menu">

                                    <div className="profile-menu-header">
                                        <div className="admin-top-avatar large">
                                            {name.charAt(0).toUpperCase()}
                                        </div>

                                        <div>
                                            <strong>{name}</strong>
                                            <span>{email}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            setProfileOpen(false)
                                        }
                                    >
                                        👤 My Profile
                                    </button>

                                    <button
                                        onClick={() => {
                                            setActiveSection("activity");
                                            setProfileOpen(false);
                                        }}
                                    >
                                        ◷ Recent Activity
                                    </button>

                                    <button
                                        className="profile-logout"
                                        onClick={handleLogout}
                                    >
                                        ↪ Logout
                                    </button>

                                </div>
                            )}

                        </div>

                    </div>

                </header>


                {/* CONTENT */}

                <div className="admin-content">

                    {/* HERO */}

                    <section className="admin-hero">

                        <div>

                            <span className="admin-eyebrow">
                                ADMINISTRATOR CONSOLE
                            </span>

                            <h1>
                                Good evening, {name.split(" ")[0]} 👋
                            </h1>

                            <p>
                                Here's what's happening across your
                                ParcelHub delivery network.
                            </p>

                        </div>

                        <div className="admin-hero-right">

                            <div className="hero-live">
                                <span></span>
                                Live system
                            </div>

                            <div className="hero-date">
                                {new Date().toLocaleDateString(
                                    "en-IN",
                                    {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    }
                                )}
                            </div>

                        </div>

                    </section>


                    {/* STATISTICS */}

                    <section className="admin-stat-grid">

                        <StatCard
                            icon="▣"
                            label="Total Shipments"
                            value={statistics.total}
                            note="All registered parcels"
                            className="indigo"
                        />

                        <StatCard
                            icon="✓"
                            label="Delivered"
                            value={statistics.delivered}
                            note={`${statistics.deliveryRate}% delivery rate`}
                            className="green"
                        />

                        <StatCard
                            icon="🚚"
                            label="In Transit"
                            value={statistics.inTransit}
                            note="Currently moving"
                            className="orange"
                        />

                        <StatCard
                            icon="♙"
                            label="Total Users"
                            value={users.length}
                            note={`${roleStatistics.customers} customers`}
                            className="purple"
                        />

                    </section>


                    {/* OVERVIEW */}

                    {activeSection === "overview" && (
                        <>

                            <section className="admin-overview-grid">

                                <div className="analytics-card">

                                    <div className="card-heading">

                                        <div>
                                            <span>SHIPMENT ANALYTICS</span>
                                            <h2>Delivery overview</h2>
                                        </div>

                                        <span className="card-period">
                                            Live
                                        </span>

                                    </div>

                                    <div className="delivery-chart">

                                        <div className="chart-main">

                                            <div className="chart-circle">

                                                <div>
                                                    <strong>
                                                        {statistics.deliveryRate}%
                                                    </strong>

                                                    <span>
                                                        delivered
                                                    </span>
                                                </div>

                                            </div>

                                        </div>

                                        <div className="chart-legend">

                                            <LegendItem
                                                color="green"
                                                label="Delivered"
                                                value={statistics.delivered}
                                            />

                                            <LegendItem
                                                color="orange"
                                                label="In Transit"
                                                value={statistics.inTransit}
                                            />

                                            <LegendItem
                                                color="blue"
                                                label="Booked"
                                                value={statistics.pending}
                                            />

                                            <LegendItem
                                                color="pink"
                                                label="Out for Delivery"
                                                value={statistics.outForDelivery}
                                            />

                                            <LegendItem
                                                color="red"
                                                label="Cancelled"
                                                value={statistics.cancelled}
                                            />

                                        </div>

                                    </div>

                                </div>


                                <div className="operations-card">

                                    <div className="card-heading">

                                        <div>
                                            <span>OPERATIONS</span>
                                            <h2>Network status</h2>
                                        </div>

                                        <div className="live-pill">
                                            <span></span>
                                            LIVE
                                        </div>

                                    </div>

                                    <div className="operation-list">

                                        <OperationRow
                                            icon="📦"
                                            title="Shipments"
                                            value={statistics.total}
                                            progress={
                                                statistics.total > 0
                                                    ? 100
                                                    : 0
                                            }
                                        />

                                        <OperationRow
                                            icon="🚚"
                                            title="Active deliveries"
                                            value={
                                                statistics.inTransit +
                                                statistics.outForDelivery
                                            }
                                            progress={
                                                statistics.total > 0
                                                    ? Math.round(
                                                        ((statistics.inTransit +
                                                            statistics.outForDelivery) /
                                                            statistics.total) *
                                                        100
                                                    )
                                                    : 0
                                            }
                                        />

                                        <OperationRow
                                            icon="✓"
                                            title="Successful deliveries"
                                            value={statistics.delivered}
                                            progress={statistics.deliveryRate}
                                        />

                                    </div>

                                </div>

                            </section>


                            <section className="admin-insights-grid">
                                <div className="admin-insight-card">
                                    <div className="admin-insight-heading"><span>LIVE BREAKDOWN</span><h2>Shipment status mix</h2><p>Current distribution of all registered parcels.</p></div>
                                    {[
                                        { label: "Booked", value: statistics.pending, color: "#6366f1" },
                                        { label: "In transit / picked up", value: statistics.inTransit, color: "#f59e0b" },
                                        { label: "Out for delivery", value: statistics.outForDelivery, color: "#ec4899" },
                                        { label: "Delivered", value: statistics.delivered, color: "#22c55e" },
                                        { label: "Cancelled", value: statistics.cancelled, color: "#ef4444" }
                                    ].map((item) => (
                                        <div className="admin-status-bar-row" key={item.label}>
                                            <div><span>{item.label}</span><strong>{item.value}</strong></div>
                                            <div className="admin-status-bar-track"><span style={{ width: `${statistics.total ? (item.value / statistics.total) * 100 : 0}%`, background: item.color }} /></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="admin-insight-card admin-sustainability-card">
                                    <div className="admin-insight-heading"><span>PLANET CONSCIOUS</span><h2>Network distance & eco estimate</h2><p>Calculated from saved route estimates, when available.</p></div>
                                    <div className="admin-eco-stat"><strong>{parcels.reduce((sum, item) => sum + Math.max(0, Number(item.distanceKm) || 0), 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong><span>total estimated road km</span></div>
                                    <div className="admin-eco-stat green"><strong>{(parcels.reduce((sum, item) => sum + Math.max(0, Number(item.distanceKm) || 0), 0) * 0.12).toFixed(2)}</strong><span>kg CO₂e illustrative estimate</span></div>
                                    <div className="admin-eco-note">Uses a demonstration factor of 0.12 kg CO₂e per road kilometre. This is an indicative estimate, not measured emissions or emissions saved.</div>
                                </div>
                            </section>

                            <section className="admin-bottom-grid">

                                <div className="activity-card">

                                    <div className="card-heading">

                                        <div>
                                            <span>RECENT ACTIVITY</span>
                                            <h2>Latest shipments</h2>
                                        </div>

                                        <button
                                            onClick={() =>
                                                setActiveSection("shipments")
                                            }
                                        >
                                            View all →
                                        </button>

                                    </div>

                                    <div className="activity-list">

                                        {recentActivity.length === 0 ? (
                                            <EmptyState
                                                icon="📦"
                                                text="No shipment activity yet."
                                            />
                                        ) : (
                                            recentActivity.map(
                                                (activity, index) => (
                                                    <div
                                                        className="activity-item"
                                                        key={`${activity.id}-${index}`}
                                                    >

                                                        <div
                                                            className={`activity-icon ${statusColors[activity.status]}`}
                                                        >
                                                            {
                                                                statusIcons[
                                                                activity.status
                                                                ]
                                                            }
                                                        </div>

                                                        <div className="activity-info">

                                                            <strong>
                                                                {
                                                                    activity.trackingNumber
                                                                }
                                                            </strong>

                                                            <span>
                                                                Shipment for{" "}
                                                                {
                                                                    activity.receiver
                                                                }
                                                            </span>

                                                        </div>

                                                        <span
                                                            className={`status-badge ${statusColors[activity.status]}`}
                                                        >
                                                            {
                                                                statusLabels[
                                                                activity.status
                                                                ]
                                                            }
                                                        </span>

                                                    </div>
                                                )
                                            )
                                        )}

                                    </div>

                                </div>


                                <div className="user-overview-card">

                                    <div className="card-heading">

                                        <div>
                                            <span>USER OVERVIEW</span>
                                            <h2>Platform users</h2>
                                        </div>

                                        <button
                                            onClick={() =>
                                                setActiveSection("users")
                                            }
                                        >
                                            Manage →
                                        </button>

                                    </div>

                                    <div className="user-role-list">

                                        <RoleRow
                                            icon="👤"
                                            label="Customers"
                                            value={roleStatistics.customers}
                                            total={users.length}
                                            className="customer"
                                        />

                                        <RoleRow
                                            icon="🚚"
                                            label="Delivery Agents"
                                            value={roleStatistics.agents}
                                            total={users.length}
                                            className="agent"
                                        />

                                        <RoleRow
                                            icon="🛡️"
                                            label="Administrators"
                                            value={roleStatistics.admins}
                                            total={users.length}
                                            className="admin"
                                        />

                                    </div>

                                </div>

                            </section>

                        </>
                    )}


                    {/* SHIPMENTS */}

                    {activeSection === "shipments" && (
                        <section className="management-card">

                            <ManagementHeader
                                title="Shipment Management"
                                subtitle="Monitor and control every parcel in the network."
                            />

                            <div className="management-toolbar">

                                <div className="search-box">
                                    <span>⌕</span>
                                    <input
                                        type="text"
                                        placeholder="Search tracking number, sender, receiver..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="filter-group">

                                    {[
                                        "ALL",
                                        "BOOKED",
                                        "IN_TRANSIT",
                                        "OUT_FOR_DELIVERY",
                                        "DELIVERED",
                                        "CANCELLED"
                                    ].map((status) => (
                                        <button
                                            key={status}
                                            className={
                                                parcelFilter === status
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setParcelFilter(status)
                                            }
                                        >
                                            {status === "ALL"
                                                ? "All"
                                                : statusLabels[status]}
                                        </button>
                                    ))}

                                </div>

                            </div>

                            <div className="table-wrapper">

                                <table className="admin-table">

                                    <thead>
                                        <tr>
                                            <th>SHIPMENT</th>
                                            <th>ROUTE</th>
                                            <th>STATUS</th>
                                            <th>CUSTOMER</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {filteredParcels.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    <EmptyState
                                                        icon="📦"
                                                        text="No parcels match your search."
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredParcels.map((parcel) => (
                                                <tr key={parcel.id}>

                                                    <td>

                                                        <div className="table-shipment">

                                                            <div className={`table-icon ${statusColors[parcel.status]}`}>
                                                                {statusIcons[parcel.status]}
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {
                                                                        parcel.trackingNumber
                                                                    }
                                                                </strong>

                                                                <span>
                                                                    Parcel #{parcel.id}
                                                                </span>
                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <div className="table-route">

                                                            <strong>
                                                                {
                                                                    parcel.senderName
                                                                }
                                                            </strong>

                                                            <span>↓</span>

                                                            <strong>
                                                                {
                                                                    parcel.receiverName
                                                                }
                                                            </strong>

                                                        </div>

                                                    </td>

                                                    <td>

                                                        <select
                                                            className={`status-select ${statusColors[parcel.status]}`}
                                                            value={
                                                                parcel.status ||
                                                                "BOOKED"
                                                            }
                                                            disabled={
                                                                actionLoading ===
                                                                `parcel-${parcel.id}`
                                                            }
                                                            onChange={(e) =>
                                                                updateParcelStatus(
                                                                    parcel.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                        >

                                                            {Object.entries(
                                                                statusLabels
                                                            ).map(
                                                                ([
                                                                    value,
                                                                    label
                                                                ]) => (
                                                                    <option
                                                                        key={
                                                                            value
                                                                        }
                                                                        value={
                                                                            value
                                                                        }
                                                                    >
                                                                        {label}
                                                                    </option>
                                                                )
                                                            )}

                                                        </select>

                                                    </td>

                                                    <td>

                                                        <span className="customer-cell">
                                                            {parcel.customer?.name ||
                                                                "Unassigned"}
                                                        </span>

                                                    </td>

                                                    <td>

                                                        <div className="table-actions">

                                                            <button
                                                                title="Track shipment"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/track/${parcel.id}`
                                                                    )
                                                                }
                                                            >
                                                                ↗
                                                            </button>

                                                            <button
                                                                className="delete-action"
                                                                title="Delete shipment"
                                                                disabled={
                                                                    actionLoading ===
                                                                    `delete-parcel-${parcel.id}`
                                                                }
                                                                onClick={() =>
                                                                    deleteParcel(
                                                                        parcel.id
                                                                    )
                                                                }
                                                            >
                                                                ×
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            ))
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>
                    )}


                    {/* USERS */}

                    {activeSection === "users" && (
                        <section className="management-card">

                            <ManagementHeader
                                title="User Management"
                                subtitle="Manage customers, delivery agents and administrators."
                            />

                            <div className="management-toolbar">

                                <div className="search-box">
                                    <span>⌕</span>

                                    <input
                                        type="text"
                                        placeholder="Search name or email..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />

                                </div>

                                <div className="filter-group">

                                    {[
                                        "ALL",
                                        "CUSTOMER",
                                        "DELIVERY_AGENT",
                                        "ADMIN"
                                    ].map((role) => (
                                        <button
                                            key={role}
                                            className={
                                                userFilter === role
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setUserFilter(role)
                                            }
                                        >
                                            {role === "ALL"
                                                ? "All"
                                                : role === "DELIVERY_AGENT"
                                                    ? "Agents"
                                                    : role === "CUSTOMER"
                                                        ? "Customers"
                                                        : "Admins"}
                                        </button>
                                    ))}

                                </div>

                            </div>

                            <div className="table-wrapper">

                                <table className="admin-table">

                                    <thead>

                                        <tr>
                                            <th>USER</th>
                                            <th>EMAIL</th>
                                            <th>ROLE</th>
                                            <th>USER ID</th>
                                            <th>ACTIONS</th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    <EmptyState
                                                        icon="👥"
                                                        text="No users match your search."
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr key={user.id}>

                                                    <td>

                                                        <div className="user-table-cell">

                                                            <div className="user-table-avatar">
                                                                {user.name
                                                                    ?.charAt(0)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {user.name}
                                                                </strong>

                                                                <span>
                                                                    ParcelHub member
                                                                </span>
                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td>
                                                        <span className="email-cell">
                                                            {user.email}
                                                        </span>
                                                    </td>

                                                    <td>

                                                        <select
                                                            className={`role-select role-${user.role?.toLowerCase()}`}
                                                            value={user.role}
                                                            disabled={
                                                                actionLoading ===
                                                                `user-${user.id}`
                                                            }
                                                            onChange={(e) =>
                                                                updateUserRole(
                                                                    user.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                        >

                                                            <option value="CUSTOMER">
                                                                Customer
                                                            </option>

                                                            <option value="DELIVERY_AGENT">
                                                                Delivery Agent
                                                            </option>

                                                            <option value="ADMIN">
                                                                Administrator
                                                            </option>

                                                        </select>

                                                    </td>

                                                    <td>
                                                        <span className="id-cell">
                                                            #{user.id}
                                                        </span>
                                                    </td>

                                                    <td>

                                                        <button
                                                            className="user-delete-button"
                                                            disabled={
                                                                actionLoading ===
                                                                `delete-user-${user.id}`
                                                            }
                                                            onClick={() =>
                                                                deleteUser(
                                                                    user.id
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </td>

                                                </tr>
                                            ))
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>
                    )}


                    {/* ACTIVITY */}

                    {activeSection === "activity" && (
                        <section className="management-card activity-full-card">

                            <ManagementHeader
                                title="System Activity"
                                subtitle="A live view of recent parcel operations."
                            />

                            <div className="full-activity-list">

                                {recentActivity.length === 0 ? (
                                    <EmptyState
                                        icon="◷"
                                        text="No activity has been recorded yet."
                                    />
                                ) : (
                                    recentActivity.map(
                                        (activity, index) => (
                                            <div
                                                className="full-activity-item"
                                                key={`${activity.id}-${index}`}
                                            >

                                                <div
                                                    className={`full-activity-icon ${statusColors[activity.status]}`}
                                                >
                                                    {
                                                        statusIcons[
                                                        activity.status
                                                        ]
                                                    }
                                                </div>

                                                <div className="full-activity-content">

                                                    <div>

                                                        <strong>
                                                            Shipment{" "}
                                                            {
                                                                activity.trackingNumber
                                                            }
                                                        </strong>

                                                        <span
                                                            className={`status-badge ${statusColors[activity.status]}`}
                                                        >
                                                            {
                                                                statusLabels[
                                                                activity.status
                                                                ]
                                                            }
                                                        </span>

                                                    </div>

                                                    <p>
                                                        Parcel associated with{" "}
                                                        <strong>
                                                            {
                                                                activity.receiver
                                                            }
                                                        </strong>
                                                        {" "}has its latest
                                                        recorded status as{" "}
                                                        {
                                                            statusLabels[
                                                            activity.status
                                                            ]
                                                        }
                                                        .
                                                    </p>

                                                </div>

                                                <span className="activity-time">
                                                    Recently
                                                </span>

                                            </div>
                                        )
                                    )
                                )}

                            </div>

                        </section>
                    )}

                </div>

            </main>

        </div>
    );
}


/* COMPONENTS */

function StatCard({
    icon,
    label,
    value,
    note,
    className
}) {
    return (
        <div className={`admin-stat-card ${className}`}>

            <div className="stat-card-top">

                <div className="stat-icon">
                    {icon}
                </div>

                <span className="stat-arrow">
                    ↗
                </span>

            </div>

            <strong className="stat-value">
                {value}
            </strong>

            <span className="stat-label">
                {label}
            </span>

            <small>
                {note}
            </small>

        </div>
    );
}


function LegendItem({
    color,
    label,
    value
}) {
    return (
        <div className="legend-item">

            <span className={`legend-dot ${color}`}></span>

            <span>{label}</span>

            <strong>{value}</strong>

        </div>
    );
}


function OperationRow({
    icon,
    title,
    value,
    progress
}) {
    return (
        <div className="operation-row">

            <div className="operation-icon">
                {icon}
            </div>

            <div className="operation-details">

                <div className="operation-title">
                    <span>{title}</span>
                    <strong>{value}</strong>
                </div>

                <div className="operation-progress">
                    <div
                        style={{
                            width: `${Math.min(progress, 100)}%`
                        }}
                    ></div>
                </div>

            </div>

        </div>
    );
}


function RoleRow({
    icon,
    label,
    value,
    total,
    className
}) {
    const percentage =
        total > 0
            ? Math.round((value / total) * 100)
            : 0;

    return (
        <div className="role-row">

            <div className={`role-icon ${className}`}>
                {icon}
            </div>

            <div className="role-details">

                <div>

                    <strong>{label}</strong>

                    <span>
                        {value} users
                    </span>

                </div>

                <div className="role-progress">

                    <div
                        className={className}
                        style={{
                            width: `${percentage}%`
                        }}
                    ></div>

                </div>

            </div>

        </div>
    );
}


function ManagementHeader({
    title,
    subtitle
}) {
    return (
        <div className="management-header">

            <div>
                <span>CONTROL CENTER</span>

                <h2>{title}</h2>

                <p>{subtitle}</p>
            </div>

            <div className="management-indicator">
                <span></span>
                Live data
            </div>

        </div>
    );
}


function EmptyState({
    icon,
    text
}) {
    return (
        <div className="empty-state">

            <div>
                {icon}
            </div>

            <p>{text}</p>

        </div>
    );
}

export default AdminDashboard;