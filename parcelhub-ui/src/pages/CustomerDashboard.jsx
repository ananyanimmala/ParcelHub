
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./CustomerDashboard.css";

const STATUS_LABELS = {
  BOOKED: "Booked",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadParcels() {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/parcels");

        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.content)
            ? response.data.content
            : [];

        if (active) setParcels(data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.status === 401
              ? "Your session may have expired. Please log in again."
              : err.response?.status === 403
                ? "You don't have permission to view these parcels."
                : "Unable to load parcels. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadParcels();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const count = (status) =>
      parcels.filter(
        (parcel) => parcel.status === status
      ).length;

    return {
      total: parcels.length,
      inTransit: count("IN_TRANSIT") +
        count("PICKED_UP") +
        count("OUT_FOR_DELIVERY"),
      delivered: count("DELIVERED"),
      cancelled: count("CANCELLED"),
    };
  }, [parcels]);

  return (
    <main className="customer-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">PARCELHUB / CUSTOMER</p>
          <h1>Your shipments, <span>under control.</span></h1>
          <p className="dashboard-subtitle">
            Book deliveries, follow their journey and keep track
            of every shipment in one place.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/create-parcel")}
        >
          + Book a shipment
        </button>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-icon">📦</span>
          <p>Total shipments</p>
          <strong>{loading ? "—" : stats.total}</strong>
          <span className="stat-note">Your parcel activity</span>
        </article>

        <article className="stat-card">
          <span className="stat-icon">🚚</span>
          <p>On the move</p>
          <strong>{loading ? "—" : stats.inTransit}</strong>
          <span className="stat-note">Picked up or in transit</span>
        </article>

        <article className="stat-card">
          <span className="stat-icon">✓</span>
          <p>Delivered</p>
          <strong>{loading ? "—" : stats.delivered}</strong>
          <span className="stat-note">Successfully completed</span>
        </article>

        <article className="stat-card">
          <span className="stat-icon">↗</span>
          <p>Cancelled</p>
          <strong>{loading ? "—" : stats.cancelled}</strong>
          <span className="stat-note">Cancelled shipments</span>
        </article>
      </section>

      <section className="shipments-section">
        <div className="section-heading">
          <div>
            <h2>Recent shipments</h2>
            <p>Check the latest status of your parcels.</p>
          </div>

          <button
            className="text-button"
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            Refresh ↻
          </button>
        </div>

        {loading && (
          <div className="dashboard-message">
            <span className="loading-spinner" />
            Loading your shipments...
          </div>
        )}

        {!loading && error && (
          <div className="dashboard-message error-message">
            <p>{error}</p>
            <button
              className="secondary-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && parcels.length === 0 && (
          <div className="empty-state">
            <span>📦</span>
            <h3>Your first shipment starts here</h3>
            <p>
              You haven't booked any shipments yet.
              Create your first booking to get started.
            </p>
            <button
              className="primary-button"
              onClick={() => navigate("/create-parcel")}
            >
              Book your first shipment
            </button>
          </div>
        )}

        {!loading && !error && parcels.length > 0 && (
          <div className="shipment-list">
            {parcels.map((parcel) => (
              <article
                className="shipment-card"
                key={parcel.id}
              >
                <div className="shipment-main">
                  <div className="shipment-icon">📦</div>

                  <div className="shipment-details">
                    <h3>
                      {parcel.receiverName || "Shipment"}
                    </h3>
                    <p>
                      Tracking ID:{" "}
                      <strong>
                        {parcel.trackingNumber || "Pending"}
                      </strong>
                    </p>
                    <p className="shipment-route">
                      {parcel.pickupAddress || "Pickup address"}{" "}
                      <span>→</span>{" "}
                      {parcel.deliveryAddress || "Delivery address"}
                    </p>
                  </div>
                </div>

                <div className="shipment-meta">
                  <span
                    className={`status-pill status-${String(
                      parcel.status || "BOOKED"
                    ).toLowerCase().replaceAll("_", "-")}`}
                  >
                    {STATUS_LABELS[parcel.status] ||
                      parcel.status ||
                      "Booked"}
                  </span>

                  <p>
                    Est. delivery:{" "}
                    {formatDate(parcel.estimatedDeliveryDate)}
                  </p>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      navigate(`/track/${parcel.id}`)
                    }
                  >
                    Track parcel →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="dashboard-footer">
        ParcelHub · Delivering with confidence.
      </footer>
    </main>
  );
}
