package ParcelHub.controller;

import ParcelHub.entity.ParcelTracking;
import ParcelHub.entity.User;
import ParcelHub.enums.ParcelStatus;
import ParcelHub.repository.UserRepository;
import ParcelHub.service.ParcelTrackingService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "*")
public class ParcelTrackingController {

    private final ParcelTrackingService trackingService;
    private final UserRepository userRepository;

    public ParcelTrackingController(
            ParcelTrackingService trackingService,
            UserRepository userRepository) {

        this.trackingService = trackingService;
        this.userRepository = userRepository;
    }

    // =========================================================
    // ADD TRACKING
    // DELIVERY AGENT / ADMIN
    // =========================================================

    @PreAuthorize(
            "hasAnyRole('DELIVERY_AGENT', 'ADMIN')"
    )
    @PostMapping("/parcel/{parcelId}")
    public ResponseEntity<ParcelTracking> addTracking(
            @PathVariable Long parcelId,
            @RequestParam ParcelStatus status) {

        try {

            return ResponseEntity.ok(
                    trackingService.addTracking(
                            parcelId,
                            status
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .notFound()
                    .build();
        }
    }

    // =========================================================
    // GET TRACKING HISTORY
    // =========================================================

    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'DELIVERY_AGENT', 'ADMIN')"
    )
    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<?> getTrackingHistory(
            @PathVariable Long parcelId,
            Authentication authentication) {

        try {

            String email =
                    authentication.getName();

            User user =
                    userRepository.findByEmail(email)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "User not found"
                                    )
                            );

            List<ParcelTracking> history =
                    trackingService
                            .getTrackingHistoryForUser(
                                    parcelId,
                                    user
                            );

            return ResponseEntity.ok(history);

        } catch (RuntimeException e) {

            if (e.getMessage() != null
                    && e.getMessage()
                    .contains("authorized")) {

                return ResponseEntity
                        .status(403)
                        .body(e.getMessage());
            }

            if (e.getMessage() != null
                    && e.getMessage()
                    .contains("Parcel not found")) {

                return ResponseEntity
                        .notFound()
                        .build();
            }

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }
}