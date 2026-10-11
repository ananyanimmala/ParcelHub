package ParcelHub.service;

import ParcelHub.dto.RouteEstimateResponse;
import ParcelHub.entity.Parcel;
import ParcelHub.entity.User;
import ParcelHub.enums.DeliveryType;
import ParcelHub.enums.ParcelStatus;
import ParcelHub.enums.PaymentStatus;
import ParcelHub.enums.PaymentMethod;
import ParcelHub.repository.ParcelRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ParcelService {

    private final ParcelRepository parcelRepository;
    private final ParcelTrackingService trackingService;
    private final DeliveryETAService deliveryETAService;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public ParcelService(
            ParcelRepository parcelRepository,
            ParcelTrackingService trackingService,
            DeliveryETAService deliveryETAService
    ) {
        this.parcelRepository = parcelRepository;
        this.trackingService = trackingService;
        this.deliveryETAService = deliveryETAService;
    }


    // =========================================================
    // GET ALL PARCELS
    // =========================================================

    public List<Parcel> getAllParcels() {

        return parcelRepository.findAll();
    }


    // =========================================================
    // GET PARCELS BY CUSTOMER
    // =========================================================

    public List<Parcel> getParcelsByCustomer(User customer) {

        return parcelRepository.findByCustomer(customer);
    }


    // =========================================================
    // GET PARCEL BY ID
    // =========================================================

    public Optional<Parcel> getParcelById(Long id) {

        return parcelRepository.findById(id);
    }


    // =========================================================
    // CREATE PARCEL
    // =========================================================

    public Parcel createParcel(Parcel parcel) {

        // -----------------------------------------------------
        // Generate unique tracking number
        // -----------------------------------------------------

        parcel.setTrackingNumber(
                generateUniqueTrackingNumber()
        );


        // -----------------------------------------------------
        // Every new shipment starts as BOOKED
        // -----------------------------------------------------

        parcel.setStatus(
                ParcelStatus.BOOKED
        );


        // -----------------------------------------------------
        // Default delivery type
        // -----------------------------------------------------

        if (parcel.getDeliveryType() == null) {

            parcel.setDeliveryType(
                    DeliveryType.STANDARD
            );
        }


        // =====================================================
        // REAL ROUTE ESTIMATION
        // =====================================================

        RouteEstimateResponse estimate =
                deliveryETAService.calculateRouteEstimate(
                        parcel.getPickupAddress(),
                        parcel.getDeliveryAddress(),
                        parcel.getDeliveryType(),
                        parcel.getWeight()
                );


        // -----------------------------------------------------
        // Stop booking if route cannot be calculated
        // -----------------------------------------------------

        if (!estimate.isRouteAvailable()) {

            throw new RuntimeException(
                    estimate.getMessage()
            );
        }


        // =====================================================
        // SAVE ROUTE INFORMATION
        // =====================================================

        parcel.setDistanceKm(
                estimate.getDistanceKm()
        );


        parcel.setEstimatedMinutes(
                estimate.getEstimatedMinutes()
        );


        parcel.setEstimatedDeliveryTime(
                estimate.getEstimatedDeliveryTime()
        );


        parcel.setEstimatedDeliveryDate(
                estimate.getEstimatedDeliveryDate()
        );


        parcel.setDeliveryCharge(
                estimate.getDeliveryCharge()
        );


        // =====================================================
        // PAYMENT STATUS
        // =====================================================

        if (parcel.getPaymentStatus() == null) {

            parcel.setPaymentStatus(
                    PaymentStatus.PENDING
            );
        }


        // =====================================================
        // SAVE
        // =====================================================

        Parcel savedParcel =
                parcelRepository.save(parcel);


        // =====================================================
        // INITIAL TRACKING EVENT
        // =====================================================

        trackingService.addTracking(
                savedParcel.getId(),
                ParcelStatus.BOOKED
        );


        return savedParcel;
    }


    // =========================================================
    // DEMO PAYMENT COMPLETION
    // =========================================================

    /**
     * Marks a non-COD parcel as paid for the college-project demo.
     * This is a simulation only; it does not charge real money.
     */
    public Parcel completeDemoPayment(Long id, User user) {

        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found"));

        if (user == null || user.getRole() == null) {
            throw new RuntimeException("Authenticated user is required");
        }

        boolean isAdmin = user.getRole().name().equals("ADMIN");
        boolean isOwner = parcel.getCustomer() != null
                && parcel.getCustomer().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("You are not allowed to pay for this parcel");
        }

        if (parcel.getStatus() == ParcelStatus.CANCELLED) {
            throw new RuntimeException("Payment cannot be completed for a cancelled parcel");
        }

        if (parcel.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            throw new RuntimeException("Cash on delivery does not require online payment");
        }

        if (parcel.getPaymentStatus() == PaymentStatus.REFUNDED) {
            throw new RuntimeException("A refunded parcel cannot be paid through this demo flow");
        }

        if (parcel.getPaymentStatus() != PaymentStatus.PAID) {
            parcel.setPaymentStatus(PaymentStatus.PAID);
            return parcelRepository.save(parcel);
        }

        return parcel;
    }


    // =========================================================
    // GENERATE UNIQUE TRACKING NUMBER
    // =========================================================

    private String generateUniqueTrackingNumber() {

        String trackingNumber;

        do {

            String date =
                    LocalDate.now()
                            .toString()
                            .replace("-", "");

            int randomNumber =
                    ThreadLocalRandom.current()
                            .nextInt(
                                    1000,
                                    10000
                            );

            trackingNumber =
                    "PH"
                            + date
                            + randomNumber;

        } while (
                parcelRepository
                        .existsByTrackingNumber(
                                trackingNumber
                        )
        );

        return trackingNumber;
    }


    // =========================================================
    // UPDATE PARCEL
    // =========================================================

    public Parcel updateParcel(
            Long id,
            Parcel parcel
    ) {

        Parcel existingParcel =
                parcelRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Parcel not found with id: "
                                                + id
                                )
                        );


        // -----------------------------------------------------
        // Cancelled parcels cannot be modified
        // -----------------------------------------------------

        if (
                existingParcel.getStatus()
                        == ParcelStatus.CANCELLED
        ) {

            throw new RuntimeException(
                    "Cancelled parcels cannot be modified"
            );
        }


        // -----------------------------------------------------
        // Delivered parcels cannot be modified
        // -----------------------------------------------------

        if (
                existingParcel.getStatus()
                        == ParcelStatus.DELIVERED
        ) {

            throw new RuntimeException(
                    "Delivered parcels cannot be modified"
            );
        }


        // =====================================================
        // UPDATE BASIC INFORMATION
        // =====================================================

        if (parcel.getSenderName() != null) {

            existingParcel.setSenderName(
                    parcel.getSenderName()
            );
        }


        if (parcel.getReceiverName() != null) {

            existingParcel.setReceiverName(
                    parcel.getReceiverName()
            );
        }


        if (parcel.getPickupAddress() != null) {

            existingParcel.setPickupAddress(
                    parcel.getPickupAddress()
            );
        }


        if (parcel.getDeliveryAddress() != null) {

            existingParcel.setDeliveryAddress(
                    parcel.getDeliveryAddress()
            );
        }


        // =====================================================
        // PARCEL TYPE
        // =====================================================

        if (parcel.getParcelType() != null) {

            existingParcel.setParcelType(
                    parcel.getParcelType()
            );
        }


        // =====================================================
        // DELIVERY TYPE
        // =====================================================

        if (parcel.getDeliveryType() != null) {

            existingParcel.setDeliveryType(
                    parcel.getDeliveryType()
            );
        }


        if (existingParcel.getDeliveryType() == null) {

            existingParcel.setDeliveryType(
                    DeliveryType.STANDARD
            );
        }


        // =====================================================
        // WEIGHT
        // =====================================================

        if (parcel.getWeight() != null) {

            existingParcel.setWeight(
                    parcel.getWeight()
            );
        }


        // =====================================================
        // PAYMENT METHOD
        // =====================================================

        if (parcel.getPaymentMethod() != null) {

            existingParcel.setPaymentMethod(
                    parcel.getPaymentMethod()
            );
        }


        // =====================================================
        // PAYMENT STATUS
        // =====================================================

        if (parcel.getPaymentStatus() != null) {

            existingParcel.setPaymentStatus(
                    parcel.getPaymentStatus()
            );
        }


        // =====================================================
        // RECALCULATE REAL ROUTE
        // =====================================================

        RouteEstimateResponse estimate =
                deliveryETAService.calculateRouteEstimate(
                        existingParcel.getPickupAddress(),
                        existingParcel.getDeliveryAddress(),
                        existingParcel.getDeliveryType(),
                        existingParcel.getWeight()
                );


        if (!estimate.isRouteAvailable()) {

            throw new RuntimeException(
                    estimate.getMessage()
            );
        }


        // =====================================================
        // UPDATE ROUTE INFORMATION
        // =====================================================

        existingParcel.setDistanceKm(
                estimate.getDistanceKm()
        );


        existingParcel.setEstimatedMinutes(
                estimate.getEstimatedMinutes()
        );


        existingParcel.setEstimatedDeliveryTime(
                estimate.getEstimatedDeliveryTime()
        );


        existingParcel.setEstimatedDeliveryDate(
                estimate.getEstimatedDeliveryDate()
        );


        existingParcel.setDeliveryCharge(
                estimate.getDeliveryCharge()
        );


        // =====================================================
        // SAVE
        // =====================================================

        return parcelRepository.save(
                existingParcel
        );
    }


    // =========================================================
    // UPDATE PARCEL STATUS
    // =========================================================

    public Parcel updateParcelStatus(
            Long id,
            ParcelStatus status
    ) {

        if (status == null) {

            throw new RuntimeException(
                    "Parcel status is required"
            );
        }


        Parcel parcel =
                parcelRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Parcel not found with id: "
                                                + id
                                )
                        );


        // -----------------------------------------------------
        // Cancelled parcels cannot be updated
        // -----------------------------------------------------

        if (
                parcel.getStatus()
                        == ParcelStatus.CANCELLED
        ) {

            throw new RuntimeException(
                    "Cancelled parcels cannot be updated"
            );
        }


        // -----------------------------------------------------
        // Delivered parcels cannot move backwards
        // -----------------------------------------------------

        if (
                parcel.getStatus()
                        == ParcelStatus.DELIVERED
                        &&
                status != ParcelStatus.DELIVERED
        ) {

            throw new RuntimeException(
                    "Delivered parcels cannot be moved to another status"
            );
        }


        // -----------------------------------------------------
        // Ensure old parcels have route information
        // -----------------------------------------------------

        ensureRouteInformation(parcel);


        // -----------------------------------------------------
        // Update status
        // -----------------------------------------------------

        parcel.setStatus(status);


        Parcel updatedParcel =
                parcelRepository.save(parcel);


        // -----------------------------------------------------
        // Add tracking event
        // -----------------------------------------------------

        trackingService.addTracking(
                id,
                status
        );


        return updatedParcel;
    }


    // =========================================================
    // PROOF OF DELIVERY
    // =========================================================

    public Parcel completeDeliveryWithProof(Long id, String deliveredTo, String note) {
        if (deliveredTo == null || deliveredTo.trim().isEmpty()) {
            throw new RuntimeException("Recipient name is required to confirm delivery");
        }

        Parcel parcel = parcelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parcel not found with id: " + id));

        if (parcel.getStatus() == ParcelStatus.CANCELLED) {
            throw new RuntimeException("Cancelled parcels cannot be delivered");
        }
        if (parcel.getStatus() == ParcelStatus.DELIVERED) {
            throw new RuntimeException("This parcel has already been delivered");
        }
        if (parcel.getStatus() != ParcelStatus.OUT_FOR_DELIVERY) {
            throw new RuntimeException("Move the parcel to OUT_FOR_DELIVERY before confirming delivery");
        }

        parcel.setDeliveredTo(deliveredTo.trim());
        parcel.setDeliveryProofNote(note == null || note.trim().isEmpty() ? null : note.trim());
        parcel.setDeliveredAt(java.time.LocalDateTime.now());
        parcel.setStatus(ParcelStatus.DELIVERED);

        Parcel saved = parcelRepository.save(parcel);
        trackingService.addTracking(id, ParcelStatus.DELIVERED);
        return saved;
    }


    // =========================================================
    // CANCEL PARCEL
    // =========================================================

    public Parcel cancelParcel(Long id) {

        Parcel parcel =
                parcelRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Parcel not found with id: "
                                                + id
                                )
                        );


        // -----------------------------------------------------
        // Delivered parcels cannot be cancelled
        // -----------------------------------------------------

        if (
                parcel.getStatus()
                        == ParcelStatus.DELIVERED
        ) {

            throw new RuntimeException(
                    "Delivered parcels cannot be cancelled"
            );
        }


        // -----------------------------------------------------
        // Already cancelled
        // -----------------------------------------------------

        if (
                parcel.getStatus()
                        == ParcelStatus.CANCELLED
        ) {

            throw new RuntimeException(
                    "Parcel is already cancelled"
            );
        }


        // -----------------------------------------------------
        // Ensure route information
        // -----------------------------------------------------

        ensureRouteInformation(parcel);


        // -----------------------------------------------------
        // Cancel
        // -----------------------------------------------------

        parcel.setStatus(
                ParcelStatus.CANCELLED
        );


        // -----------------------------------------------------
        // Refund paid shipment
        // -----------------------------------------------------

        if (
                parcel.getPaymentStatus()
                        == PaymentStatus.PAID
        ) {

            parcel.setPaymentStatus(
                    PaymentStatus.REFUNDED
            );
        }


        // -----------------------------------------------------
        // Save
        // -----------------------------------------------------

        Parcel cancelledParcel =
                parcelRepository.save(parcel);


        // -----------------------------------------------------
        // Tracking
        // -----------------------------------------------------

        trackingService.addTracking(
                cancelledParcel.getId(),
                ParcelStatus.CANCELLED
        );


        return cancelledParcel;
    }


    // =========================================================
    // ENSURE ROUTE INFORMATION
    // =========================================================

    private void ensureRouteInformation(
            Parcel parcel
    ) {

        /*
         * Old parcels created before the route engine may
         * not have distance/ETA values.
         *
         * We calculate them only when necessary.
         */

        if (
                parcel.getDistanceKm() != null
                        &&
                parcel.getEstimatedMinutes() != null
                        &&
                parcel.getEstimatedDeliveryTime() != null
                        &&
                parcel.getEstimatedDeliveryDate() != null
                        &&
                parcel.getDeliveryCharge() != null
        ) {

            return;
        }


        if (parcel.getDeliveryType() == null) {

            parcel.setDeliveryType(
                    DeliveryType.STANDARD
            );
        }


        RouteEstimateResponse estimate =
                deliveryETAService.calculateRouteEstimate(
                        parcel.getPickupAddress(),
                        parcel.getDeliveryAddress(),
                        parcel.getDeliveryType(),
                        parcel.getWeight()
                );


        if (!estimate.isRouteAvailable()) {

            throw new RuntimeException(
                    estimate.getMessage()
            );
        }


        parcel.setDistanceKm(
                estimate.getDistanceKm()
        );


        parcel.setEstimatedMinutes(
                estimate.getEstimatedMinutes()
        );


        parcel.setEstimatedDeliveryTime(
                estimate.getEstimatedDeliveryTime()
        );


        parcel.setEstimatedDeliveryDate(
                estimate.getEstimatedDeliveryDate()
        );


        parcel.setDeliveryCharge(
                estimate.getDeliveryCharge()
        );


        if (parcel.getPaymentStatus() == null) {

            parcel.setPaymentStatus(
                    PaymentStatus.PENDING
            );
        }
    }


    // =========================================================
    // DELETE PARCEL
    // =========================================================

    public void deleteParcel(Long id) {

        if (
                !parcelRepository.existsById(id)
        ) {

            throw new RuntimeException(
                    "Parcel not found with id: "
                            + id
            );
        }


        parcelRepository.deleteById(id);
    }
}