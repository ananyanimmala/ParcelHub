package ParcelHub.service;


import ParcelHub.dto.RouteEstimateResponse;

import ParcelHub.enums.DeliveryType;


import com.fasterxml.jackson.databind.JsonNode;

import com.fasterxml.jackson.databind.ObjectMapper;


import org.springframework.stereotype.Service;

import org.springframework.web.util.UriComponentsBuilder;


import java.net.URI;

import java.net.http.HttpClient;

import java.net.http.HttpRequest;

import java.net.http.HttpResponse;


import java.time.LocalDate;

import java.time.LocalDateTime;


import java.util.Locale;


@Service

public class DeliveryETAService {


    private final HttpClient httpClient;


    private final ObjectMapper objectMapper;


    // =========================================================

    // API URLS

    // =========================================================


    private static final String NOMINATIM_URL =

            "https://nominatim.openstreetmap.org/search";


    private static final String OSRM_URL =

            "https://router.project-osrm.org/route/v1/driving";


    // =========================================================

    // CONSTRUCTOR

    // =========================================================


    public DeliveryETAService() {


        this.httpClient =

                HttpClient.newBuilder()

                        .build();


        this.objectMapper =

                new ObjectMapper();

    }


    // =========================================================

    // MAIN ROUTE ESTIMATE

    // =========================================================


    public RouteEstimateResponse calculateRouteEstimate(

            String pickupAddress,

            String deliveryAddress,

            DeliveryType deliveryType,

            Double weight

    ) {


        RouteEstimateResponse response =

                new RouteEstimateResponse();


        try {


            // =================================================

            // VALIDATION

            // =================================================


            if (

                    pickupAddress == null

                            ||

                    pickupAddress.trim().isEmpty()

            ) {


                response.setRouteAvailable(false);


                response.setMessage(

                        "Pickup address is required"

                );


                return response;

            }


            if (

                    deliveryAddress == null

                            ||

                    deliveryAddress.trim().isEmpty()

            ) {


                response.setRouteAvailable(false);


                response.setMessage(

                        "Delivery address is required"

                );


                return response;

            }


            // =================================================

            // DEFAULT DELIVERY TYPE

            // =================================================


            if (deliveryType == null) {


                deliveryType =

                        DeliveryType.STANDARD;

            }


            // =================================================

            // GEOCODE PICKUP

            // =================================================


            double[] pickupCoordinates =

                    geocodeAddress(

                            pickupAddress

                    );


            if (pickupCoordinates == null) {


                response.setRouteAvailable(false);


                response.setMessage(

                        "Pickup location could not be found. " +

                        "Please enter a valid city, locality or address."

                );


                return response;

            }


            // =================================================

            // GEOCODE DELIVERY

            // =================================================


            double[] deliveryCoordinates =

                    geocodeAddress(

                            deliveryAddress

                    );


            if (deliveryCoordinates == null) {


                response.setRouteAvailable(false);


                response.setMessage(

                        "Delivery location could not be found. " +

                        "Please enter a valid city, locality or address."

                );


                return response;

            }


            // =================================================

            // PREVENT FALSE ZERO-DISTANCE ROUTES

            // =================================================

            // Geocoders sometimes resolve short locality names to the same

            // city-centre result. For Hyderabad localities, retry with an

            // explicit city/state before accepting that result.

            double straightLineKm = haversineKm(

                    pickupCoordinates[0], pickupCoordinates[1],

                    deliveryCoordinates[0], deliveryCoordinates[1]

            );

            if (straightLineKm < 0.15

                    && !pickupAddress.trim().equalsIgnoreCase(deliveryAddress.trim())) {

                double[] pickupLocality = performGeocoding(

                        pickupAddress.trim() + ", Hyderabad, Telangana, India");

                double[] deliveryLocality = performGeocoding(

                        deliveryAddress.trim() + ", Hyderabad, Telangana, India");

                if (pickupLocality != null && deliveryLocality != null) {

                    double localityDistance = haversineKm(

                            pickupLocality[0], pickupLocality[1],

                            deliveryLocality[0], deliveryLocality[1]);

                    if (localityDistance >= 0.15) {

                        pickupCoordinates = pickupLocality;

                        deliveryCoordinates = deliveryLocality;

                    }

                }

            }


            // If distinct entered addresses still resolve to essentially the

            // same point, do not show a fake 0 km / 0 min estimate.

            if (haversineKm(pickupCoordinates[0], pickupCoordinates[1],

                    deliveryCoordinates[0], deliveryCoordinates[1]) < 0.05

                    && !pickupAddress.trim().equalsIgnoreCase(deliveryAddress.trim())) {

                response.setRouteAvailable(false);

                response.setMessage("Both addresses resolved to nearly the same map location. "

                        + "Please add the locality, city and state to both addresses.");

                return response;

            }


            // =================================================

            // ROAD ROUTE

            // =================================================

System.out.println("========== ROUTE DEBUG ==========");

System.out.println("Pickup address: " + pickupAddress);

System.out.println("Delivery address: " + deliveryAddress);


System.out.println(

        "Pickup coordinates [lat, lon]: "

                + pickupCoordinates[0] + ", "

                + pickupCoordinates[1]

);


System.out.println(

        "Delivery coordinates [lat, lon]: "

                + deliveryCoordinates[0] + ", "

                + deliveryCoordinates[1]

);


// Geocoding arrays are [latitude, longitude].
// getRoadRoute converts these to OSRM's required longitude,latitude URL order.
double[] route = getRoadRoute(

        pickupCoordinates[0], pickupCoordinates[1],

        deliveryCoordinates[0], deliveryCoordinates[1]

);


System.out.println("OSRM distance (km): " + route[0]);

System.out.println("OSRM duration (minutes): " + route[1] / 60.0);

System.out.println("=================================");


            if (route == null || route[0] <= 0 || route[1] <= 0) {


                response.setRouteAvailable(false);


                response.setMessage(

                        "No road route could be found between these locations."

                );


                return response;

            }


            // =================================================

            // DISTANCE

            // =================================================


            double distanceKm =

                    route[0];


            // =================================================

            // ROAD TRAVEL TIME

            // =================================================


            int routeMinutes =

                    (int) Math.ceil(

                            route[1]

                    );


            // =================================================

            // PARCELHUB ETA

            // =================================================


            int estimatedMinutes =

                    calculateEstimatedMinutes(

                            distanceKm,

                            routeMinutes,

                            deliveryType

                    );


            // =================================================

            // ESTIMATED ARRIVAL

            // =================================================


            LocalDateTime estimatedDeliveryTime =

                    LocalDateTime.now()

                            .plusMinutes(

                                    estimatedMinutes

                            );


            LocalDate estimatedDeliveryDate =

                    estimatedDeliveryTime.toLocalDate();


            // =================================================

            // DELIVERY CHARGE

            // =================================================


            double deliveryCharge =

                    calculateDeliveryCharge(

                            distanceKm,

                            deliveryType,

                            weight

                    );


            // =================================================

            // RESPONSE

            // =================================================


            response.setRouteAvailable(true);


            response.setMessage(

                    "Route calculated successfully"

            );


            response.setDistanceKm(

                    round(

                            distanceKm,

                            2

                    )

            );


            response.setRouteMinutes(

                    routeMinutes

            );


            response.setEstimatedMinutes(

                    estimatedMinutes

            );


            response.setEstimatedDeliveryTime(

                    estimatedDeliveryTime

            );


            response.setEstimatedDeliveryDate(

                    estimatedDeliveryDate

            );


            response.setDeliveryCharge(

                    deliveryCharge

            );


            response.setDeliveryType(

                    deliveryType.name()

            );


            return response;


        } catch (Exception e) {


            e.printStackTrace();


            response.setRouteAvailable(false);


            response.setMessage(

                    "Unable to calculate route: "

                            +

                    e.getMessage()

            );


            return response;

        }

    }


    // =========================================================

    // GEOCODING

    // =========================================================


    private double[] geocodeAddress(

            String address

    ) throws Exception {


        String cleanAddress =

                address.trim();


        /*

         * IMPORTANT:

         *

         * We DO NOT automatically append Hyderabad.

         *

         * This allows:

         *

         * Hyderabad

         * Mumbai

         * Pune

         * Bengaluru

         * Delhi

         * Chennai

         * Vijayawada

         * etc.

         *

         * to work correctly.

         */


        // =====================================================

        // FIRST ATTEMPT

        // Exact address + India

        // =====================================================


        double[] result =

                performGeocoding(

                        cleanAddress

                                +

                        ", India"

                );


        if (result != null) {


            return result;

        }


        // =====================================================

        // SECOND ATTEMPT

        // Exact address only

        // =====================================================


        result =

                performGeocoding(

                        cleanAddress

                );


        if (result != null) {


            return result;

        }


        // =====================================================

        // THIRD ATTEMPT

        // Hyderabad fallback for localities

        // =====================================================


        /*

         * This is useful when the user enters:

         *

         * Chaitanyapuri

         * Malakpet

         * Kukatpally

         *

         * without mentioning Hyderabad.

         */


        result =

                performGeocoding(

                        cleanAddress

                                +

                        ", Hyderabad, Telangana, India"

                );


        return result;

    }


    // =========================================================

    // PERFORM GEOCODING REQUEST

    // =========================================================


    private double[] performGeocoding(

            String query

    ) throws Exception {


        URI uri =

                UriComponentsBuilder

                        .fromUriString(

                                NOMINATIM_URL

                        )


                        .queryParam(

                                "q",

                                query

                        )


                        .queryParam(

                                "format",

                                "jsonv2"

                        )


                        .queryParam(

                                "limit",

                                "1"

                        )


                        .queryParam(

                                "countrycodes",

                                "in"

                        )


                        .build()


                        .encode()


                        .toUri();


        // =====================================================

        // REQUEST

        // =====================================================


        HttpRequest request =

                HttpRequest.newBuilder()


                        .uri(uri)


                        .header(

                                "User-Agent",

                                "ParcelHub-CollegeProject/1.0"

                        )


                        .header(

                                "Accept",

                                "application/json"

                        )


                        .GET()


                        .build();


        // =====================================================

        // SEND

        // =====================================================


        HttpResponse<String> httpResponse =

                httpClient.send(

                        request,

                        HttpResponse.BodyHandlers.ofString()

                );


        // =====================================================

        // STATUS

        // =====================================================


        if (

                httpResponse.statusCode() != 200

        ) {


            return null;

        }


        // =====================================================

        // PARSE JSON

        // =====================================================


        JsonNode root =

                objectMapper.readTree(

                        httpResponse.body()

                );


        // =====================================================

        // NO RESULTS

        // =====================================================


        if (

                !root.isArray()

                        ||

                root.isEmpty()

        ) {


            return null;

        }


        JsonNode first =

                root.get(0);


        // =====================================================

        // LATITUDE

        // =====================================================


        JsonNode latitudeNode =

                first.get("lat");


        // =====================================================

        // LONGITUDE

        // =====================================================


        JsonNode longitudeNode =

                first.get("lon");


        if (

                latitudeNode == null

                        ||

                longitudeNode == null

        ) {


            return null;

        }


        double latitude =

                latitudeNode.asDouble();


        double longitude =

                longitudeNode.asDouble();


        return new double[]{


                latitude,


                longitude


        };

    }


    // =========================================================

    // ROAD ROUTING

    // =========================================================


private double[] getRoadRoute(

        double pickupLatitude,

        double pickupLongitude,

        double deliveryLatitude,

        double deliveryLongitude

) throws Exception {


    // OSRM requires longitude,latitude;longitude,latitude.

    String coordinates = String.format(

            Locale.US,

            "%.7f,%.7f;%.7f,%.7f",

            pickupLongitude,

            pickupLatitude,

            deliveryLongitude,

            deliveryLatitude

    );


    URI uri = URI.create(

            OSRM_URL + "/" + coordinates + "?overview=false"

    );


    System.out.println("ParcelHub OSRM request: " + uri);


    HttpRequest request = HttpRequest.newBuilder()

            .uri(uri)

            .header("User-Agent", "ParcelHub-CollegeProject/1.0")

            .header("Accept", "application/json")

            .GET()

            .build();


    HttpResponse<String> httpResponse = httpClient.send(

            request,

            HttpResponse.BodyHandlers.ofString()

    );


    System.out.println("OSRM HTTP status: " + httpResponse.statusCode());

    System.out.println("OSRM response: " + httpResponse.body());


    if (httpResponse.statusCode() != 200) {

        throw new RuntimeException(

                "OSRM returned HTTP " + httpResponse.statusCode()

        );

    }


    JsonNode root = objectMapper.readTree(httpResponse.body());


    if (!"Ok".equals(root.path("code").asText())) {

        throw new RuntimeException(

                "OSRM error: " + root.path("code").asText()

                        + " - "

                        + root.path("message").asText("No details")

        );

    }


    JsonNode routes = root.path("routes");


    if (!routes.isArray() || routes.isEmpty()) {

        throw new RuntimeException(

                "OSRM returned no route for coordinates: " + coordinates

        );

    }


    JsonNode route = routes.get(0);


    double distanceMeters = route.path("distance").asDouble(-1);

    double durationSeconds = route.path("duration").asDouble(-1);


    if (!Double.isFinite(distanceMeters)

            || !Double.isFinite(durationSeconds)

            || distanceMeters <= 0

            || durationSeconds <= 0) {

        throw new RuntimeException(

                "OSRM returned an invalid distance or travel duration."

        );

    }


    double distanceKm = distanceMeters / 1000.0;

    double durationMinutes = durationSeconds / 60.0;


    System.out.println("Pickup coordinates: "

            + pickupLatitude + ", " + pickupLongitude);

    System.out.println("Delivery coordinates: "

            + deliveryLatitude + ", " + deliveryLongitude);

    System.out.println("Road distance: " + distanceKm + " km");

    System.out.println("Road travel time: " + durationMinutes + " minutes");


    return new double[]{distanceKm, durationMinutes};

}

    // =========================================================

    // ETA ENGINE

    // =========================================================


    public int calculateEstimatedMinutes(

            double distanceKm,

            int routeMinutes,

            DeliveryType deliveryType

    ) {


        // =====================================================

        // INSTANT

        // =====================================================


        if (

                deliveryType

                        == DeliveryType.INSTANT

        ) {


            int buffer;


            if (distanceKm <= 5) {


                buffer = 10;


            } else if (distanceKm <= 10) {


                buffer = 12;


            } else if (distanceKm <= 15) {


                buffer = 15;


            } else if (distanceKm <= 25) {


                buffer = 20;


            } else {


                buffer = 30;

            }


            return Math.max(

                    10,

                    routeMinutes + buffer

            );

        }


        // =====================================================

        // EXPRESS

        // =====================================================


        if (

                deliveryType

                        == DeliveryType.EXPRESS

        ) {


            int buffer = 25;


            if (distanceKm > 15) {


                buffer = 35;

            }


            return Math.max(

                    40,

                    routeMinutes + buffer

            );

        }


        // =====================================================

        // STANDARD

        // =====================================================


        if (distanceKm <= 10) {


            return 24 * 60;

        }


        if (distanceKm <= 25) {


            return 2 * 24 * 60;

        }


        return 3 * 24 * 60;

    }


    // =========================================================

    // DELIVERY CHARGE

    // =========================================================


    public double calculateDeliveryCharge(

            double distanceKm,

            DeliveryType deliveryType,

            Double weight

    ) {


        double charge;


        // =====================================================

        // DISTANCE

        // =====================================================


        if (distanceKm <= 5) {


            charge = 50;


        } else if (distanceKm <= 10) {


            charge = 70;


        } else if (distanceKm <= 15) {


            charge = 90;


        } else if (distanceKm <= 25) {


            charge = 120;


        } else if (distanceKm <= 50) {


            charge = 180;


        } else {


            charge = 250;

        }


        // =====================================================

        // DELIVERY PRIORITY

        // =====================================================


        if (

                deliveryType

                        == DeliveryType.INSTANT

        ) {


            charge += 30;


        } else if (

                deliveryType

                        == DeliveryType.EXPRESS

        ) {


            charge += 20;

        }


        // =====================================================

        // WEIGHT

        // =====================================================


        if (weight != null) {


            if (weight > 5) {


                charge += 25;

            }


            if (weight > 10) {


                charge += 50;

            }

        }


        return charge;

    }


    // =========================================================

    // COMPATIBILITY METHOD

    // =========================================================


    public LocalDateTime calculateDeliveryTime(

            int estimatedMinutes

    ) {


        return LocalDateTime.now()

                .plusMinutes(

                        estimatedMinutes

                );

    }


    // =========================================================

    // COMPATIBILITY METHOD

    // =========================================================


    public LocalDate calculateDeliveryDate(

            DeliveryType deliveryType,

            int estimatedMinutes

    ) {


        return calculateDeliveryTime(

                estimatedMinutes

        ).toLocalDate();

    }


    // =========================================================

    // ROUND

    // =========================================================


        // =========================================================

    // ROUND

    // =========================================================


    private double round(

            double value,

            int decimalPlaces

    ) {

        double multiplier = Math.pow(10, decimalPlaces);


        return Math.round(value * multiplier) / multiplier;

    }


    // =========================================================

    // HAVERSINE DISTANCE

    // =========================================================


    private double haversineKm(

            double lat1,

            double lon1,

            double lat2,

            double lon2

    ) {

        final double EARTH_RADIUS_KM = 6371.0088;


        double latitudeDifference = Math.toRadians(lat2 - lat1);

        double longitudeDifference = Math.toRadians(lon2 - lon1);


        double a = Math.sin(latitudeDifference / 2)

                * Math.sin(latitudeDifference / 2)

                + Math.cos(Math.toRadians(lat1))

                * Math.cos(Math.toRadians(lat2))

                * Math.sin(longitudeDifference / 2)

                * Math.sin(longitudeDifference / 2);


        double boundedA = Math.max(0.0, Math.min(1.0, a));


        return 2 * EARTH_RADIUS_KM

                * Math.atan2(

                        Math.sqrt(boundedA),

                        Math.sqrt(1.0 - boundedA)

                );

    }

}
