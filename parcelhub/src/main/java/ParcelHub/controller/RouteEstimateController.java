package ParcelHub.controller;

import ParcelHub.dto.RouteEstimateResponse;
import ParcelHub.enums.DeliveryType;
import ParcelHub.service.DeliveryETAService;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/route")
@CrossOrigin(origins = "*")
public class RouteEstimateController {


    private final DeliveryETAService deliveryETAService;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public RouteEstimateController(
            DeliveryETAService deliveryETAService
    ) {

        this.deliveryETAService =
                deliveryETAService;
    }


    // =========================================================
    // ROUTE ESTIMATE
    // =========================================================

    @GetMapping("/estimate")
    public ResponseEntity<?> estimateRoute(

            @RequestParam String pickupAddress,

            @RequestParam String deliveryAddress,

            @RequestParam DeliveryType deliveryType,

            @RequestParam(
                    required = false
            )
            Double weight

    ) {

        try {


            // =================================================
            // DEFAULT DELIVERY TYPE
            // =================================================

            if (deliveryType == null) {

                deliveryType =
                        DeliveryType.STANDARD;
            }


            // =================================================
            // CALCULATE ROUTE
            // =================================================

            RouteEstimateResponse result =
                    deliveryETAService.calculateRouteEstimate(

                            pickupAddress,

                            deliveryAddress,

                            deliveryType,

                            weight

                    );


            // =================================================
            // ROUTE FAILED
            // =================================================

            if (
                    !result.isRouteAvailable()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(result);
            }


            // =================================================
            // SUCCESS
            // =================================================

            return ResponseEntity.ok(
                    result
            );


        } catch (Exception e) {


            e.printStackTrace();


            return ResponseEntity
                    .badRequest()
                    .body(
                            "Unable to calculate route: "
                                    +
                            e.getMessage()
                    );
        }
    }
}