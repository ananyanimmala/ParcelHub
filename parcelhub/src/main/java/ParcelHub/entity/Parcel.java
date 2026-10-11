package ParcelHub.entity;

import ParcelHub.enums.DeliveryType;
import ParcelHub.enums.ParcelStatus;
import ParcelHub.enums.ParcelType;
import ParcelHub.enums.PaymentMethod;
import ParcelHub.enums.PaymentStatus;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "parcels")
public class Parcel {

    // =========================================================
    // ID
    // =========================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    // =========================================================
    // CUSTOMER
    // =========================================================

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;


    // =========================================================
    // BASIC PARCEL INFORMATION
    // =========================================================

    /*
     * Tracking number is generated automatically by
     * ParcelService.
     *
     * Therefore, we DO NOT use @NotBlank here.
     */

    @Column(unique = true, nullable = false)
    private String trackingNumber;


    @NotBlank(message = "Sender name is required")
    private String senderName;


    @NotBlank(message = "Receiver name is required")
    private String receiverName;


    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;


    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;


    // =========================================================
    // PARCEL DETAILS
    // =========================================================

    @Enumerated(EnumType.STRING)
    private ParcelType parcelType;


    private Double weight;


    // =========================================================
    // DELIVERY DETAILS
    // =========================================================

    @Enumerated(EnumType.STRING)
    private DeliveryType deliveryType;


    @Enumerated(EnumType.STRING)
    private ParcelStatus status;


    /*
     * Calculated automatically based on pickup and
     * delivery locations.
     */

    private Double distanceKm;


    /*
     * Estimated delivery duration in minutes.
     *
     * Example:
     * 25 = 25 minutes
     * 45 = 45 minutes
     * 120 = 2 hours
     */

    private Integer estimatedMinutes;


    /*
     * Exact estimated arrival date and time.
     *
     * Example:
     * 2026-10-06T14:35:00
     */

    private LocalDateTime estimatedDeliveryTime;


    /*
     * Estimated delivery date.
     */

    private LocalDate estimatedDeliveryDate;


    // =========================================================
    // PAYMENT DETAILS
    // =========================================================

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;


    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;


    private Double deliveryCharge;

    // Proof of delivery information (recorded when the agent completes delivery).
    private String deliveredTo;

    @Column(length = 1000)
    private String deliveryProofNote;

    private LocalDateTime deliveredAt;


    // =========================================================
    // CONSTRUCTORS
    // =========================================================

    public Parcel() {
    }


    public Parcel(
            String trackingNumber,
            String senderName,
            String receiverName,
            String pickupAddress,
            String deliveryAddress,
            ParcelStatus status
    ) {
        this.trackingNumber = trackingNumber;
        this.senderName = senderName;
        this.receiverName = receiverName;
        this.pickupAddress = pickupAddress;
        this.deliveryAddress = deliveryAddress;
        this.status = status;
    }


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public Long getId() {
        return id;
    }


    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }


    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }


    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }


    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }


    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }


    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }


    public ParcelType getParcelType() {
        return parcelType;
    }

    public void setParcelType(ParcelType parcelType) {
        this.parcelType = parcelType;
    }


    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }


    public DeliveryType getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(DeliveryType deliveryType) {
        this.deliveryType = deliveryType;
    }


    public ParcelStatus getStatus() {
        return status;
    }

    public void setStatus(ParcelStatus status) {
        this.status = status;
    }


    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }


    public Integer getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(Integer estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }


    public LocalDateTime getEstimatedDeliveryTime() {
        return estimatedDeliveryTime;
    }

    public void setEstimatedDeliveryTime(
            LocalDateTime estimatedDeliveryTime
    ) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
    }


    public LocalDate getEstimatedDeliveryDate() {
        return estimatedDeliveryDate;
    }

    public void setEstimatedDeliveryDate(
            LocalDate estimatedDeliveryDate
    ) {
        this.estimatedDeliveryDate = estimatedDeliveryDate;
    }


    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(
            PaymentMethod paymentMethod
    ) {
        this.paymentMethod = paymentMethod;
    }


    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(
            PaymentStatus paymentStatus
    ) {
        this.paymentStatus = paymentStatus;
    }


    public Double getDeliveryCharge() {
        return deliveryCharge;
    }

    public void setDeliveryCharge(
            Double deliveryCharge
    ) {
        this.deliveryCharge = deliveryCharge;
    }


    public String getDeliveredTo() {
        return deliveredTo;
    }

    public void setDeliveredTo(String deliveredTo) {
        this.deliveredTo = deliveredTo;
    }

    public String getDeliveryProofNote() {
        return deliveryProofNote;
    }

    public void setDeliveryProofNote(String deliveryProofNote) {
        this.deliveryProofNote = deliveryProofNote;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
}