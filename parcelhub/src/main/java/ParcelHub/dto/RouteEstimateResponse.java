package ParcelHub.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class RouteEstimateResponse {

    private boolean routeAvailable;

    private String message;

    private Double distanceKm;

    private Integer routeMinutes;

    private Integer estimatedMinutes;

    private LocalDateTime estimatedDeliveryTime;

    private LocalDate estimatedDeliveryDate;

    private Double deliveryCharge;

    private String deliveryType;


    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public RouteEstimateResponse() {
    }


    // =========================================================
    // GETTERS AND SETTERS
    // =========================================================

    public boolean isRouteAvailable() {
        return routeAvailable;
    }

    public void setRouteAvailable(boolean routeAvailable) {
        this.routeAvailable = routeAvailable;
    }


    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }


    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }


    public Integer getRouteMinutes() {
        return routeMinutes;
    }

    public void setRouteMinutes(Integer routeMinutes) {
        this.routeMinutes = routeMinutes;
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


    public Double getDeliveryCharge() {
        return deliveryCharge;
    }

    public void setDeliveryCharge(
            Double deliveryCharge
    ) {
        this.deliveryCharge = deliveryCharge;
    }


    public String getDeliveryType() {
        return deliveryType;
    }

    public void setDeliveryType(
            String deliveryType
    ) {
        this.deliveryType = deliveryType;
    }
}