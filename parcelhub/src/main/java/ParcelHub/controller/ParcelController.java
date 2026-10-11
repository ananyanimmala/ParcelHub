package ParcelHub.controller;

import ParcelHub.entity.Parcel;
import ParcelHub.entity.User;
import ParcelHub.enums.ParcelStatus;
import ParcelHub.repository.UserRepository;
import ParcelHub.service.ParcelService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parcels")
@CrossOrigin(origins = "*")
public class ParcelController {


    private final ParcelService parcelService;
    private final UserRepository userRepository;


    public ParcelController(
            ParcelService parcelService,
            UserRepository userRepository
    ) {

        this.parcelService = parcelService;
        this.userRepository = userRepository;
    }


    // =========================================================
    // GET PARCELS
    // =========================================================

    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'DELIVERY_AGENT', 'ADMIN')"
    )
    @GetMapping
    public ResponseEntity<?> getAllParcels(
            Authentication authentication
    ) {

        try {

            if (authentication == null) {

                return ResponseEntity
                        .status(401)
                        .body("Authentication required");
            }


            String email =
                    authentication.getName();


            User user =
                    userRepository
                            .findByEmail(email)
                            .orElse(null);


            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(
                                "User account not found. Please login again."
                        );
            }


            if (user.getRole() == null) {

                return ResponseEntity
                        .status(403)
                        .body("User role is not configured");
            }


            String role =
                    user.getRole().name();


            // ADMIN
            if (role.equals("ADMIN")) {

                return ResponseEntity.ok(
                        parcelService.getAllParcels()
                );
            }


            // CUSTOMER
            if (role.equals("CUSTOMER")) {

                return ResponseEntity.ok(
                        parcelService
                                .getParcelsByCustomer(user)
                );
            }


            // DELIVERY AGENT
            if (role.equals("DELIVERY_AGENT")) {

                return ResponseEntity.ok(
                        parcelService.getAllParcels()
                );
            }


            return ResponseEntity
                    .status(403)
                    .body("Invalid user role");


        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            "Unable to load parcels: "
                                    + e.getMessage()
                    );
        }
    }


    // =========================================================
    // GET SINGLE PARCEL
    // =========================================================

    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'DELIVERY_AGENT', 'ADMIN')"
    )
    @GetMapping("/{id}")
    public ResponseEntity<?> getParcelById(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {

                return ResponseEntity
                        .status(401)
                        .body("Authentication required");
            }


            String email =
                    authentication.getName();


            User user =
                    userRepository
                            .findByEmail(email)
                            .orElse(null);


            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body("User account not found");
            }


            return parcelService
                    .getParcelById(id)
                    .map(parcel -> {

                        String role =
                                user.getRole().name();


                        // ADMIN
                        if (role.equals("ADMIN")) {

                            return ResponseEntity.ok(
                                    parcel
                            );
                        }


                        // DELIVERY AGENT
                        if (
                                role.equals(
                                        "DELIVERY_AGENT"
                                )
                        ) {

                            return ResponseEntity.ok(
                                    parcel
                            );
                        }


                        // CUSTOMER
                        if (
                                role.equals(
                                        "CUSTOMER"
                                )
                        ) {

                            if (
                                    parcel.getCustomer() != null
                                            &&
                                    parcel.getCustomer()
                                            .getId()
                                            .equals(
                                                    user.getId()
                                            )
                            ) {

                                return ResponseEntity.ok(
                                        parcel
                                );
                            }


                            return ResponseEntity
                                    .status(403)
                                    .<Parcel>build();
                        }


                        return ResponseEntity
                                .status(403)
                                .<Parcel>build();

                    })
                    .orElse(
                            ResponseEntity
                                    .notFound()
                                    .build()
                    );


        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            "Unable to load parcel: "
                                    + e.getMessage()
                    );
        }
    }


    // =========================================================
    // CREATE PARCEL
    // =========================================================

    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'ADMIN')"
    )
    @PostMapping
    public ResponseEntity<?> createParcel(
            @Valid @RequestBody Parcel parcel,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {

                return ResponseEntity
                        .status(401)
                        .body("Authentication required");
            }


            String email =
                    authentication.getName();


            User user =
                    userRepository
                            .findByEmail(email)
                            .orElse(null);


            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(
                                "User account not found. Please login again."
                        );
            }


            if (user.getRole() == null) {

                return ResponseEntity
                        .status(403)
                        .body("User role is not configured");
            }


            /*
             * Customers automatically become the owner
             * of the parcel they create.
             */

            if (
                    user.getRole()
                            .name()
                            .equals("CUSTOMER")
            ) {

                parcel.setCustomer(user);
            }


            Parcel savedParcel =
                    parcelService.createParcel(
                            parcel
                    );


            return ResponseEntity.ok(
                    savedParcel
            );


        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(400)
                    .body(
                            "Unable to create parcel: "
                                    + e.getMessage()
                    );
        }
    }


    // =========================================================
    // DEMO PAYMENT COMPLETION (NO REAL MONEY IS CHARGED)
    // =========================================================

    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    @PostMapping("/{id}/demo-payment")
    public ResponseEntity<?> completeDemoPayment(
            @PathVariable Long id,
            Authentication authentication
    ) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(401).body("Authentication required");
            }

            User user = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(401).body("User account not found. Please login again.");
            }

            return ResponseEntity.ok(parcelService.completeDemoPayment(id, user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Unable to complete demo payment");
        }
    }


    // =========================================================
    // UPDATE PARCEL
    // ADMIN ONLY
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateParcel(
            @PathVariable Long id,
            @Valid @RequestBody Parcel parcel
    ) {

        try {

            return ResponseEntity.ok(
                    parcelService.updateParcel(
                            id,
                            parcel
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(404)
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // UPDATE STATUS
    // DELIVERY AGENT / ADMIN
    // =========================================================

    @PreAuthorize(
            "hasAnyRole('DELIVERY_AGENT', 'ADMIN')"
    )
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateParcelStatus(
            @PathVariable Long id,
            @RequestParam ParcelStatus status
    ) {

        try {

            return ResponseEntity.ok(
                    parcelService.updateParcelStatus(
                            id,
                            status
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // CONFIRM DELIVERY WITH PROOF DETAILS
    // DELIVERY AGENT / ADMIN
    // =========================================================

    @PreAuthorize("hasAnyRole('DELIVERY_AGENT', 'ADMIN')")
    @PostMapping("/{id}/proof-of-delivery")
    public ResponseEntity<?> confirmDeliveryWithProof(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> proof
    ) {
        try {
            String deliveredTo = proof == null ? null : proof.get("deliveredTo");
            String note = proof == null ? null : proof.get("note");
            return ResponseEntity.ok(parcelService.completeDeliveryWithProof(id, deliveredTo, note));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    // =========================================================
    // CANCEL PARCEL
    // CUSTOMER / ADMIN
    // =========================================================

    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'ADMIN')"
    )
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelParcel(
            @PathVariable Long id,
            Authentication authentication
    ) {

        try {

            if (authentication == null) {

                return ResponseEntity
                        .status(401)
                        .body(
                                "Authentication required"
                        );
            }


            String email =
                    authentication.getName();


            User user =
                    userRepository
                            .findByEmail(email)
                            .orElse(null);


            if (user == null) {

                return ResponseEntity
                        .status(401)
                        .body(
                                "User account not found"
                        );
            }


            Parcel parcel =
                    parcelService
                            .getParcelById(id)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Parcel not found"
                                    )
                            );


            /*
             * Customers can cancel ONLY their own
             * parcels.
             */

            if (
                    user.getRole()
                            .name()
                            .equals("CUSTOMER")
            ) {

                if (
                        parcel.getCustomer() == null
                                ||
                        !parcel.getCustomer()
                                .getId()
                                .equals(
                                        user.getId()
                                )
                ) {

                    return ResponseEntity
                            .status(403)
                            .body(
                                    "You are not authorized to cancel this parcel"
                            );
                }
            }


            Parcel cancelledParcel =
                    parcelService.cancelParcel(id);


            return ResponseEntity.ok(
                    cancelledParcel
            );


        } catch (RuntimeException e) {

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }


    // =========================================================
    // DELETE PARCEL
    // ADMIN ONLY
    // =========================================================

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteParcel(
            @PathVariable Long id
    ) {

        try {

            parcelService.deleteParcel(id);

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (RuntimeException e) {

            return ResponseEntity
                    .notFound()
                    .build();
        }
    }
}