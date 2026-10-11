package ParcelHub.service;

import ParcelHub.entity.Parcel;
import ParcelHub.entity.ParcelTracking;
import ParcelHub.entity.User;
import ParcelHub.enums.ParcelStatus;
import ParcelHub.repository.ParcelRepository;
import ParcelHub.repository.ParcelTrackingRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ParcelTrackingService {

    private final ParcelTrackingRepository trackingRepository;
    private final ParcelRepository parcelRepository;

    public ParcelTrackingService(
            ParcelTrackingRepository trackingRepository,
            ParcelRepository parcelRepository) {

        this.trackingRepository = trackingRepository;
        this.parcelRepository = parcelRepository;
    }

    // =========================================================
    // ADD TRACKING ENTRY
    // =========================================================

    public ParcelTracking addTracking(
            Long parcelId,
            ParcelStatus status) {

        Parcel parcel = parcelRepository
                .findById(parcelId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Parcel not found"
                        )
                );

        ParcelTracking tracking =
                new ParcelTracking();

        tracking.setParcel(parcel);
        tracking.setStatus(status);
        tracking.setUpdatedAt(
                LocalDateTime.now()
        );

        return trackingRepository.save(
                tracking
        );
    }

    // =========================================================
    // GET TRACKING HISTORY
    // =========================================================

    public List<ParcelTracking> getTrackingHistory(
            Long parcelId) {

        Parcel parcel = parcelRepository
                .findById(parcelId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Parcel not found"
                        )
                );

        return trackingRepository
                .findByParcelOrderByUpdatedAtAsc(parcel);
    }

    // =========================================================
    // GET TRACKING HISTORY FOR LOGGED-IN USER
    // =========================================================

    public List<ParcelTracking> getTrackingHistoryForUser(
            Long parcelId,
            User user) {

        Parcel parcel = parcelRepository
                .findById(parcelId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Parcel not found"
                        )
                );

        String role = user.getRole().name();

        // ADMIN can view all tracking
        if (role.equals("ADMIN")) {

            return trackingRepository
                    .findByParcelOrderByUpdatedAtAsc(parcel);
        }

        // DELIVERY AGENT can view all tracking
        if (role.equals("DELIVERY_AGENT")) {

            return trackingRepository
                    .findByParcelOrderByUpdatedAtAsc(parcel);
        }

        // CUSTOMER can view only their own parcel
        if (role.equals("CUSTOMER")) {

            if (parcel.getCustomer() == null) {

                throw new RuntimeException(
                        "You are not authorized to view this parcel"
                );
            }

            if (!parcel.getCustomer()
                    .getId()
                    .equals(user.getId())) {

                throw new RuntimeException(
                        "You are not authorized to view this parcel"
                );
            }

            return trackingRepository
                    .findByParcelOrderByUpdatedAtAsc(parcel);
        }

        throw new RuntimeException(
                "You are not authorized to view this parcel"
        );
    }
}