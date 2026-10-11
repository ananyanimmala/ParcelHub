import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../services/api";

import "./CreateParcel.css";


function CreateParcel() {

    const navigate = useNavigate();


    // =========================================================
    // FORM STATE
    // =========================================================

    const [formData, setFormData] = useState({

        senderName: "",

        receiverName: "",

        pickupAddress: "",

        deliveryAddress: "",

        parcelType: "REGULAR_PARCEL",

        weight: "",

        deliveryType: "STANDARD",

        paymentMethod: "UPI"

    });


    // =========================================================
    // ESTIMATE STATE
    // =========================================================

    const [estimate, setEstimate] = useState(null);

    const [loadingEstimate, setLoadingEstimate] =
        useState(false);

    // Tracks the latest route request so an older response can never
    // overwrite a newer pickup/delivery address estimate.
    const estimateRequestId = useRef(0);

    // idle | pending | loading | success | error
    const [estimateStatus, setEstimateStatus] = useState("idle");


    // =========================================================
    // BOOKING STATE
    // =========================================================

    const [booking, setBooking] =
        useState(false);


    // Demo checkout state. This intentionally does not collect real
    // card numbers, PINs, passwords, or OTPs.
    const [pendingPaymentParcel, setPendingPaymentParcel] = useState(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentComplete, setPaymentComplete] = useState(false);
    const [paymentError, setPaymentError] = useState("");


    // =========================================================
    // MESSAGES
    // =========================================================

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    // =========================================================
    // FORMAT CURRENCY
    // =========================================================

    const formatCurrency = (amount) => {

        if (
            amount === null ||
            amount === undefined
        ) {
            return "₹0";
        }


        return `₹${Number(amount).toFixed(0)}`;
    };


    // =========================================================
    // FORMAT TIME
    // =========================================================

    const formatTime = (dateString) => {

        if (!dateString) {
            return "--";
        }


        const date =
            new Date(dateString);


        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (dateString) => {

        if (!dateString) {
            return "--";
        }


        const date =
            new Date(dateString);


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    };


    // =========================================================
    // FORMAT DURATION
    // =========================================================

    const formatDuration = (minutes) => {

        if (
            minutes === null ||
            minutes === undefined
        ) {
            return "--";
        }


        if (minutes < 60) {

            return `${minutes} min`;
        }


        const hours =
            Math.floor(
                minutes / 60
            );


        const remainingMinutes =
            minutes % 60;


        if (remainingMinutes === 0) {

            return `${hours} hr`;
        }


        return `${hours} hr ${remainingMinutes} min`;
    };


    // =========================================================
    // HANDLE INPUT
    // =========================================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));

        // Invalidate the displayed estimate as soon as route inputs change.
        // This also prevents booking with a price calculated for old addresses.
        if (["pickupAddress", "deliveryAddress", "deliveryType", "weight"].includes(name)) {
            estimateRequestId.current += 1;
            setEstimate(null);
            setLoadingEstimate(false);

            const nextPickup = name === "pickupAddress" ? value : formData.pickupAddress;
            const nextDelivery = name === "deliveryAddress" ? value : formData.deliveryAddress;
            setEstimateStatus(
                nextPickup.trim() && nextDelivery.trim() ? "pending" : "idle"
            );
        }

        setMessage("");
        setError("");
    };

    const swapAddresses = () => {
        estimateRequestId.current += 1;
        setFormData(previous => ({
            ...previous,
            pickupAddress: previous.deliveryAddress,
            deliveryAddress: previous.pickupAddress
        }));
        setEstimate(null);
        setLoadingEstimate(false);
        setEstimateStatus(
            formData.pickupAddress.trim() && formData.deliveryAddress.trim()
                ? "pending"
                : "idle"
        );
        setMessage("");
        setError("");
    };


    // =========================================================
    // CALCULATE REAL ROUTE ESTIMATE
    // =========================================================

    const calculateEstimate = async () => {

        const requestId = ++estimateRequestId.current;
        const pickupAddress = formData.pickupAddress.trim();
        const deliveryAddress = formData.deliveryAddress.trim();

        if (!pickupAddress || !deliveryAddress) {
            setEstimate(null);
            setLoadingEstimate(false);
            setEstimateStatus("idle");
            return;
        }

        setLoadingEstimate(true);
        setEstimateStatus("loading");
        setEstimate(null);
        setError("");

        try {
            const params = {
                pickupAddress,
                deliveryAddress,
                deliveryType: formData.deliveryType
            };

            if (formData.weight && Number(formData.weight) > 0) {
                params.weight = Number(formData.weight);
            }

            const response = await API.get("/route/estimate", { params });

            // Ignore a response if the user has edited any route input since
            // this request started.
            if (requestId !== estimateRequestId.current) return;

            const data = response.data;

            if (!data?.routeAvailable) {
                setEstimate(null);
                setEstimateStatus("error");
                setError(
                    data?.message ||
                    "Unable to calculate this route. Check both locations and try again."
                );
                return;
            }

            setEstimate({
                distance: data.distanceKm,
                routeMinutes: data.routeMinutes,
                minutes: data.estimatedMinutes,
                charge: data.deliveryCharge,
                arrival: data.estimatedDeliveryTime,
                date: data.estimatedDeliveryDate,
                pickupAddress,
                deliveryAddress,
                deliveryType: formData.deliveryType,
                weight: formData.weight
            });
            setEstimateStatus("success");

        } catch (err) {
            if (requestId !== estimateRequestId.current) return;

            console.error("Route estimate error:", err);
            setEstimate(null);
            setEstimateStatus("error");

            const responseData = err.response?.data;
            if (responseData?.message) {
                setError(responseData.message);
            } else if (typeof responseData === "string") {
                setError(responseData);
            } else if (!err.response) {
                setError(
                    "Route service is not responding. Check that the Spring Boot backend is running, then try again."
                );
            } else {
                setError(
                    "Unable to calculate this route. Please check the addresses and try again."
                );
            }

        } finally {
            if (requestId === estimateRequestId.current) {
                setLoadingEstimate(false);
            }
        }
    };

    // =========================================================
    // AUTOMATIC ROUTE CALCULATION
    // =========================================================

    useEffect(() => {

        const timer =
            setTimeout(() => {

                calculateEstimate();

            }, 900);


        return () => {

            clearTimeout(timer);

        };

    }, [

        formData.pickupAddress,

        formData.deliveryAddress,

        formData.deliveryType,

        formData.weight

    ]);


    // =========================================================
    // HANDLE DELIVERY TYPE
    // =========================================================

    const selectDeliveryType = (
        deliveryType
    ) => {

        estimateRequestId.current += 1;
        setEstimate(null);
        setLoadingEstimate(false);
        setEstimateStatus(
            formData.pickupAddress.trim() && formData.deliveryAddress.trim()
                ? "pending"
                : "idle"
        );

        setFormData(previous => ({
            ...previous,
            deliveryType
        }));

        setMessage("");
        setError("");
    };


    // =========================================================
    // HANDLE PAYMENT METHOD
    // =========================================================

    const selectPaymentMethod = (
        paymentMethod
    ) => {

        setFormData(
            previous => ({
                ...previous,
                paymentMethod
            })
        );
    };


    // =========================================================
    // BOOK SHIPMENT
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        setBooking(true);

        setMessage("");

        setError("");


        try {

            // -------------------------------------------------
            // Require route estimate
            // -------------------------------------------------

            const estimateMatchesCurrentForm = estimate &&
                estimate.pickupAddress === formData.pickupAddress.trim() &&
                estimate.deliveryAddress === formData.deliveryAddress.trim() &&
                estimate.deliveryType === formData.deliveryType &&
                String(estimate.weight ?? "") === String(formData.weight ?? "");

            if (!estimateMatchesCurrentForm || loadingEstimate || estimateStatus !== "success") {
                setError(
                    "Please wait for the latest route estimate before booking."
                );
                setBooking(false);
                return;
            }


            // -------------------------------------------------
            // Payload
            // -------------------------------------------------

            const payload = {

                senderName:
                    formData.senderName.trim(),

                receiverName:
                    formData.receiverName.trim(),

                pickupAddress:
                    formData.pickupAddress.trim(),

                deliveryAddress:
                    formData.deliveryAddress.trim(),

                parcelType:
                    formData.parcelType,

                weight:
                    formData.weight
                        ? Number(formData.weight)
                        : null,

                deliveryType:
                    formData.deliveryType,

                paymentMethod:
                    formData.paymentMethod

            };


            console.log(
                "Creating parcel:",
                payload
            );


            // -------------------------------------------------
            // Backend creates the shipment
            // -------------------------------------------------

            const response =
                await API.post(
                    "/parcels",
                    payload
                );


            console.log(
                "Parcel created successfully:",
                response.data
            );


            // -------------------------------------------------
            // COD can finish booking immediately. Online methods
            // continue to the clearly-labelled demo checkout.
            // -------------------------------------------------

            if (formData.paymentMethod === "CASH_ON_DELIVERY") {
                setMessage(
                    `Shipment booked successfully! Tracking number: ${response.data.trackingNumber}. Payment is due on delivery.`
                );
                setTimeout(() => navigate("/dashboard"), 1800);
            } else {
                setPendingPaymentParcel(response.data);
                setPaymentComplete(false);
                setPaymentError("");
            }


        } catch (err) {

            console.error(
                "Booking error:",
                err
            );


            const responseData =
                err.response?.data;


            if (
                typeof responseData === "string"
            ) {

                setError(
                    responseData
                );

            } else if (
                responseData?.message
            ) {

                setError(
                    responseData.message
                );

            } else {

                setError(
                    "Unable to create parcel. Please try again."
                );
            }

        } finally {

            setBooking(false);
        }
    };


    // =========================================================
    // COMPLETE SIMULATED CHECKOUT
    // =========================================================

    const completeDemoPayment = async () => {
        if (!pendingPaymentParcel?.id || paymentProcessing) return;

        setPaymentProcessing(true);
        setPaymentError("");

        try {
            await API.post(`/parcels/${pendingPaymentParcel.id}/demo-payment`);
            setPaymentComplete(true);
        } catch (err) {
            const data = err.response?.data;
            setPaymentError(
                typeof data === "string"
                    ? data
                    : data?.message || "Demo payment could not be completed. Please try again."
            );
        } finally {
            setPaymentProcessing(false);
        }
    };


    // =========================================================
    // DELIVERY OPTIONS
    // =========================================================

    const deliveryOptions = [

        {
            value: "INSTANT",

            icon: "⚡",

            title: "Instant Delivery",

            description:
                "Priority local delivery",

            badge:
                "Fastest option"
        },


        {
            value: "EXPRESS",

            icon: "🚀",

            title: "Express Delivery",

            description:
                "Fast priority delivery",

            badge:
                "Same-day priority"
        },


        {
            value: "STANDARD",

            icon: "📦",

            title: "Standard Delivery",

            description:
                "Affordable scheduled delivery",

            badge:
                "Best value"
        }

    ];


    // =========================================================
    // PAYMENT OPTIONS
    // =========================================================

    const paymentOptions = [

        {
            value: "UPI",

            icon: "📱",

            label: "UPI"
        },


        {
            value: "CARD",

            icon: "💳",

            label: "Card"
        },


        {
            value: "NET_BANKING",

            icon: "🏦",

            label: "Net Banking"
        },


        {
            value: "CASH_ON_DELIVERY",

            icon: "💵",

            label: "Cash on Delivery"
        }

    ];


    // =========================================================
    // DELIVERY LABEL
    // =========================================================

    const deliveryLabel =
        formData.deliveryType === "INSTANT"
            ? "Instant"
            : formData.deliveryType === "EXPRESS"
                ? "Express"
                : "Standard";


    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="create-page">


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="create-sidebar">


                <div className="create-brand">

                    <div className="create-brand-icon">
                        P
                    </div>


                    <div>

                        <h2>
                            ParcelHub
                        </h2>

                        <span>
                            Smart Delivery
                        </span>

                    </div>

                </div>


                <nav className="create-nav">


                    <button
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >

                        <span>
                            ⌂
                        </span>

                        Dashboard

                    </button>


                    <button
                        className="active"
                    >

                        <span>
                            ＋
                        </span>

                        Create Parcel

                    </button>


                    <button
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >

                        <span>
                            ▣
                        </span>

                        My Shipments

                    </button>


                    <button
                        onClick={() =>
                            navigate("/ai-assistant")
                        }
                    >

                        <span>
                            ✦
                        </span>

                        ParcelHub AI

                    </button>


                </nav>


                <div className="create-sidebar-bottom">

                    <div className="create-security">

                        <span>
                            🔒
                        </span>


                        <div>

                            <strong>
                                Secure Delivery
                            </strong>


                            <small>
                                Your shipments are protected
                            </small>

                        </div>

                    </div>

                </div>


            </aside>


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="create-main">


                {/* =================================================
                    TOP BAR
                ================================================= */}

                <header className="create-topbar">


                    <div>

                        <span className="create-eyebrow">
                            SHIPMENT MANAGEMENT
                        </span>


                        <h1>
                            Create New Shipment
                        </h1>

                    </div>


                    <button
                        className="back-button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Back to Dashboard
                    </button>


                </header>


                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="create-content">


                    {/* =================================================
                        FORM
                    ================================================= */}

                    <div className="create-form-section">


                        <div className="section-heading">


                            <div className="section-number">
                                01
                            </div>


                            <div>

                                <h2>
                                    Shipment Details
                                </h2>


                                <p>
                                    Tell us where your parcel
                                    is going.
                                </p>

                            </div>


                        </div>


                        <form
                            onSubmit={handleSubmit}
                        >


                            {/* =====================================
                                SENDER / RECEIVER
                            ====================================== */}

                            <div className="form-grid">


                                <div className="form-group">

                                    <label>
                                        Sender Name
                                    </label>


                                    <input
                                        type="text"
                                        name="senderName"
                                        value={
                                            formData.senderName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter sender name"
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Receiver Name
                                    </label>


                                    <input
                                        type="text"
                                        name="receiverName"
                                        value={
                                            formData.receiverName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter receiver name"
                                        required
                                    />

                                </div>


                            </div>


                            {/* =====================================
                                ADDRESSES
                            ====================================== */}

                            <div className="form-grid">


                                <div className="form-group">

                                    <label>
                                        Pickup Address
                                    </label>


                                    <textarea
                                        name="pickupAddress"
                                        value={
                                            formData.pickupAddress
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: Chaitanyapuri, Hyderabad, Telangana"
                                        rows="3"
                                        autoComplete="street-address"
                                        required
                                    />
                                    <span className="route-field-hint">
                                        Include locality, city and state for the best match.
                                    </span>

                                </div>


                                <div className="form-group">

                                    <label>
                                        Delivery Address
                                    </label>


                                    <textarea
                                        name="deliveryAddress"
                                        value={
                                            formData.deliveryAddress
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: Benz Circle, Vijayawada, Andhra Pradesh"
                                        rows="3"
                                        autoComplete="street-address"
                                        required
                                    />
                                    <span className="route-field-hint">
                                        City-to-city routes are supported across India.
                                    </span>

                                </div>


                            </div>


                            <div className="route-swap-row">
                                <span>Route calculated using road directions</span>
                                <button
                                    type="button"
                                    className="route-swap-button"
                                    onClick={swapAddresses}
                                    disabled={!formData.pickupAddress.trim() || !formData.deliveryAddress.trim()}
                                >
                                    ⇅ Swap locations
                                </button>
                            </div>


                            {/* =====================================
                                PARCEL DETAILS
                            ====================================== */}

                            <div className="form-grid">


                                <div className="form-group">

                                    <label>
                                        Parcel Type
                                    </label>


                                    <select
                                        name="parcelType"
                                        value={
                                            formData.parcelType
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="DOCUMENT">
                                            📄 Document
                                        </option>


                                        <option value="REGULAR_PARCEL">
                                            📦 Regular Parcel
                                        </option>


                                        <option value="FRAGILE">
                                            🧊 Fragile
                                        </option>


                                        <option value="ELECTRONICS">
                                            💻 Electronics
                                        </option>


                                        <option value="OTHER">
                                            📋 Other
                                        </option>


                                    </select>

                                </div>


                                <div className="form-group">

                                    <label>

                                        Weight

                                        <span className="optional">
                                            kg
                                        </span>

                                    </label>


                                    <input
                                        type="number"
                                        name="weight"
                                        value={
                                            formData.weight
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. 2.5"
                                        min="0.1"
                                        step="0.1"
                                    />

                                </div>


                            </div>


                            {/* =====================================
                                DELIVERY TYPE
                            ====================================== */}

                            <div className="delivery-section">


                                <div className="section-heading small">


                                    <div className="section-number">
                                        02
                                    </div>


                                    <div>

                                        <h2>
                                            Choose Delivery Speed
                                        </h2>


                                        <p>
                                            Select the option
                                            that suits you best.
                                        </p>

                                    </div>


                                </div>


                                <div className="delivery-options">


                                    {deliveryOptions.map(
                                        option => (

                                            <button
                                                key={
                                                    option.value
                                                }
                                                type="button"
                                                className={
                                                    `delivery-option ${
                                                        formData.deliveryType ===
                                                        option.value
                                                            ? "selected"
                                                            : ""
                                                    }`
                                                }
                                                onClick={() =>
                                                    selectDeliveryType(
                                                        option.value
                                                    )
                                                }
                                            >


                                                <div className="delivery-option-top">


                                                    <span className="delivery-icon">

                                                        {
                                                            option.icon
                                                        }

                                                    </span>


                                                    <span className="delivery-check">
                                                        ✓
                                                    </span>


                                                </div>


                                                <strong>

                                                    {
                                                        option.title
                                                    }

                                                </strong>


                                                <span className="delivery-description">

                                                    {
                                                        option.description
                                                    }

                                                </span>


                                                <span className="delivery-badge">

                                                    {
                                                        option.badge
                                                    }

                                                </span>


                                            </button>

                                        )
                                    )}


                                </div>


                            </div>


                            {/* =====================================
                                PAYMENT
                            ====================================== */}

                            <div className="payment-section">


                                <div className="section-heading small">


                                    <div className="section-number">
                                        03
                                    </div>


                                    <div>

                                        <h2>
                                            Payment Method
                                        </h2>


                                        <p>
                                            Choose how you'd like
                                            to pay.
                                        </p>

                                    </div>


                                </div>


                                <div className="payment-grid">


                                    {paymentOptions.map(
                                        option => (

                                            <button
                                                key={
                                                    option.value
                                                }
                                                type="button"
                                                className={
                                                    `payment-option ${
                                                        formData.paymentMethod ===
                                                        option.value
                                                            ? "selected"
                                                            : ""
                                                    }`
                                                }
                                                onClick={() =>
                                                    selectPaymentMethod(
                                                        option.value
                                                    )
                                                }
                                            >

                                                <span>
                                                    {
                                                        option.icon
                                                    }
                                                </span>


                                                {
                                                    option.label
                                                }

                                            </button>

                                        )
                                    )}


                                </div>


                            </div>


                            {/* =====================================
                                ERROR
                            ====================================== */}

                            {error && (

                                <div className="create-error">

                                    ⚠️ {error}

                                </div>

                            )}


                            {/* =====================================
                                SUCCESS
                            ====================================== */}

                            {message && (

                                <div className="create-success">

                                    ✓ {message}

                                </div>

                            )}


                            {/* =====================================
                                BOOK
                            ====================================== */}

                            <button
                                type="submit"
                                className="book-button"
                                disabled={
                                    booking ||
                                    loadingEstimate ||
                                    !estimate
                                }
                            >

                                {booking

                                    ? "Booking Shipment..."

                                    : loadingEstimate

                                        ? "Calculating Route..."

                                        : "Book Shipment →"

                                }

                            </button>


                        </form>


                    </div>


                    {/* =================================================
                        LIVE ESTIMATE
                    ================================================= */}

                    <aside className="estimate-card">


                        <div className="estimate-header">


                            <span className="estimate-label">
                                LIVE ROUTE ESTIMATE
                            </span>


                            <span className="estimate-dot">
                                ●
                            </span>


                        </div>


                        <h2>
                            Delivery Estimate
                        </h2>


                        <p className="estimate-subtitle">
                            Road distance is calculated from mapped locations and driving directions.
                            Results are estimates; full addresses improve matching accuracy.
                        </p>

                        {estimateStatus === "pending" && !loadingEstimate && (
                            <div className="route-status-note pending" role="status">
                                <span className="route-status-indicator" />
                                Route details changed. A fresh estimate will be calculated shortly.
                            </div>
                        )}

                        {estimateStatus === "error" && !loadingEstimate && !estimate && (
                            <div className="route-status-note error" role="status">
                                Check the pickup and delivery locations, then edit either field to retry.
                            </div>
                        )}


                        {/* =============================================
                            LOADING
                        ============================================== */}

                        {loadingEstimate ? (

                            <div className="estimate-loading">

                                <div className="estimate-spinner">
                                </div>


                                <span>
                                    Calculating real road route...
                                </span>

                            </div>

                        ) : estimate ? (

                            <>


                                {/* =====================================
                                    ETA HERO
                                ====================================== */}

                                <div className="estimate-hero">


                                    <span className="estimate-hero-icon">

                                        {
                                            formData.deliveryType ===
                                            "INSTANT"

                                                ? "⚡"

                                                : formData.deliveryType ===
                                                  "EXPRESS"

                                                    ? "🚀"

                                                    : "📦"
                                        }

                                    </span>


                                    <div>


                                        <strong>

                                            {
                                                formatDuration(
                                                    estimate.minutes
                                                )
                                            }

                                        </strong>


                                        <span>
                                            ParcelHub estimated delivery
                                        </span>


                                    </div>


                                </div>


                                {/* =====================================
                                    ARRIVAL
                                ====================================== */}

                                <div className="estimate-arrival">


                                    <span>
                                        Estimated arrival
                                    </span>


                                    <strong>

                                        {estimate.minutes <
                                        24 * 60

                                            ? `Today, ${formatTime(
                                                estimate.arrival
                                            )}`

                                            : formatDate(
                                                estimate.date
                                            )

                                        }

                                    </strong>


                                </div>


                                {/* =====================================
                                    DETAILS
                                ====================================== */}

                                <div className="estimate-details">


                                    <div className="estimate-row">


                                        <span>
                                            📍 Road distance
                                        </span>


                                        <strong>
                                            {
                                                Number(
                                                    estimate.distance
                                                ).toFixed(2)
                                            } km
                                        </strong>


                                    </div>


                                    <div className="estimate-row">


                                        <span>
                                            🚗 Road travel
                                        </span>


                                        <strong>
                                            {
                                                formatDuration(
                                                    estimate.routeMinutes
                                                )
                                            }
                                        </strong>


                                    </div>


                                    <div className="estimate-row">


                                        <span>
                                            🚚 Delivery
                                        </span>


                                        <strong>
                                            {
                                                deliveryLabel
                                            }
                                        </strong>


                                    </div>


                                    <div className="estimate-row">


                                        <span>
                                            💰 Delivery charge
                                        </span>


                                        <strong className="price">
                                            {
                                                formatCurrency(
                                                    estimate.charge
                                                )
                                            }
                                        </strong>


                                    </div>


                                </div>


                                {/* =====================================
                                    INSTANT INFO
                                ====================================== */}

                                {formData.deliveryType ===
                                    "INSTANT"
                                    && (

                                        <div className="instant-note">


                                            <span>
                                                ⚡
                                            </span>


                                            <div>


                                                <strong>
                                                    Priority delivery
                                                </strong>


                                                <p>

                                                    ParcelHub adds an
                                                    operational buffer
                                                    to the actual road
                                                    travel time.

                                                </p>


                                            </div>


                                        </div>

                                    )}


                                {/* =====================================
                                    ROUTE PREVIEW
                                ====================================== */}

                                <div className="route-preview">


                                    <div className="route-point">


                                        <span className="route-dot pickup">
                                        </span>


                                        <div>


                                            <small>
                                                PICKUP
                                            </small>


                                            <strong>
                                                {
                                                    formData.pickupAddress
                                                }
                                            </strong>


                                        </div>


                                    </div>


                                    <div className="route-line">
                                    </div>


                                    <div className="route-point">


                                        <span className="route-dot delivery">
                                        </span>


                                        <div>


                                            <small>
                                                DELIVERY
                                            </small>


                                            <strong>
                                                {
                                                    formData.deliveryAddress
                                                }
                                            </strong>


                                        </div>


                                    </div>


                                </div>

                                <a
                                    className="route-directions-link"
                                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(formData.pickupAddress)}&destination=${encodeURIComponent(formData.deliveryAddress)}&travelmode=driving`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Open driving directions <span aria-hidden="true">↗</span>
                                </a>


                            </>

                        ) : (

                            /* =========================================
                               EMPTY
                            ========================================== */

                            <div className="estimate-empty">


                                <div>
                                    📍
                                </div>


                                <strong>
                                    Enter your route
                                </strong>


                                <p>

                                    Add pickup and delivery
                                    addresses to calculate
                                    the real road distance,
                                    travel time, ETA and price.

                                </p>


                            </div>

                        )}


                        {/* =============================================
                            FOOTER
                        ============================================== */}

                        <div className="estimate-footer">


                            <span>
                                🛡️ Secure
                            </span>


                            <span>
                                📍 Road routing
                            </span>


                            <span>
                                ✦ Smart ETA
                            </span>


                        </div>


                    </aside>


                </div>


            </main>

            {pendingPaymentParcel && (
                <div className="ph-payment-overlay" role="dialog" aria-modal="true" aria-labelledby="ph-payment-title">
                    <div className="ph-payment-modal">
                        {!paymentComplete ? (
                            <>
                                <div className="ph-payment-icon" aria-hidden="true">₹</div>
                                <p className="ph-payment-eyebrow">PARCELHUB CHECKOUT</p>
                                <h2 id="ph-payment-title">Confirm demo payment</h2>
                                <p className="ph-payment-copy">
                                    Your shipment has been created. This college-project checkout simulates a successful payment; it will not charge real money.
                                </p>
                                <div className="ph-payment-summary">
                                    <span>Payment method</span>
                                    <strong>{String(pendingPaymentParcel.paymentMethod || formData.paymentMethod).replaceAll("_", " ")}</strong>
                                    <span>Delivery charge</span>
                                    <strong>₹{Number(pendingPaymentParcel.deliveryCharge ?? estimate?.charge ?? 0).toFixed(2)}</strong>
                                    <span>Tracking number</span>
                                    <strong>{pendingPaymentParcel.trackingNumber}</strong>
                                </div>
                                <div className="ph-demo-notice">
                                    <span aria-hidden="true">ⓘ</span>
                                    Demo only. Do not enter a real card number, UPI PIN, banking password, or OTP.
                                </div>
                                {paymentError && <div className="ph-payment-error" role="alert">{paymentError}</div>}
                                <button className="ph-pay-button" type="button" onClick={completeDemoPayment} disabled={paymentProcessing}>
                                    {paymentProcessing ? "Processing demo payment…" : `Pay ₹${Number(pendingPaymentParcel.deliveryCharge ?? estimate?.charge ?? 0).toFixed(2)} (demo)`}
                                </button>
                                <button className="ph-payment-secondary" type="button" onClick={() => navigate("/dashboard")} disabled={paymentProcessing}>
                                    Finish later — payment remains pending
                                </button>
                            </>
                        ) : (
                            <div className="ph-payment-success">
                                <div className="ph-payment-success-icon" aria-hidden="true">✓</div>
                                <p className="ph-payment-eyebrow">PAYMENT CONFIRMED</p>
                                <h2 id="ph-payment-title">You're all set!</h2>
                                <p className="ph-payment-copy">Demo payment recorded successfully. Your shipment is booked and the payment status is now PAID.</p>
                                <div className="ph-payment-reference">
                                    <span>Tracking number</span>
                                    <strong>{pendingPaymentParcel.trackingNumber}</strong>
                                </div>
                                <button className="ph-pay-button" type="button" onClick={() => navigate("/dashboard")}>View my shipments <span aria-hidden="true">→</span></button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}


export default CreateParcel;