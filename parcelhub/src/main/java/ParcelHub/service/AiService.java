package ParcelHub.service;

import ParcelHub.entity.Parcel;
import ParcelHub.entity.User;
import ParcelHub.repository.ParcelRepository;
import ParcelHub.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiService {

    private final ParcelRepository parcelRepository;
    private final UserRepository userRepository;

    public AiService(
            ParcelRepository parcelRepository,
            UserRepository userRepository) {

        this.parcelRepository = parcelRepository;
        this.userRepository = userRepository;
    }

    public String generateResponse(String email, String message) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        List<Parcel> parcels =
                parcelRepository.findByCustomer(user);

        if (message == null || message.trim().isEmpty()) {
            return "Please enter a question so I can help you.";
        }

        String question = message
                .trim()
                .toLowerCase();

        /*
         * -------------------------------------------------
         * GREETING
         * -------------------------------------------------
         */

        if (question.contains("hello")
                || question.equals("hi")
                || question.startsWith("hi ")
                || question.contains("hey")) {

            return "Hello "
                    + user.getName()
                    + "! 👋 I'm ParcelHub AI Assistant. "
                    + "I can help you with shipment status, "
                    + "tracking information, delivery stages, "
                    + "pickup information, and your parcels.";
        }

        /*
         * -------------------------------------------------
         * HELP
         * -------------------------------------------------
         */

        if (question.contains("help")
                || question.contains("what can you do")
                || question.contains("what do you do")) {

            return "I can help you with:\n\n"
                    + "• Shipment status\n"
                    + "• Parcel tracking\n"
                    + "• Delivery stages\n"
                    + "• Pickup information\n"
                    + "• Delivered shipments\n"
                    + "• In-transit shipments\n"
                    + "• Delivery information\n\n"
                    + "Try asking: \"Where is my parcel?\"";
        }

        /*
         * -------------------------------------------------
         * IN TRANSIT MEANING
         * -------------------------------------------------
         * This must come before the general IN_TRANSIT
         * count check.
         */

        if (question.contains("in transit")
                && (question.contains("meaning")
                || question.contains("what does")
                || question.contains("means")
                || question.contains("mean"))) {

            return "In Transit means your parcel has been "
                    + "picked up and is currently moving "
                    + "through the delivery network toward "
                    + "its destination.";
        }

        /*
         * -------------------------------------------------
         * PICKED UP MEANING
         * -------------------------------------------------
         */

        if (question.contains("picked up")
                && (question.contains("meaning")
                || question.contains("what does")
                || question.contains("means")
                || question.contains("mean"))) {

            return "Picked Up means the delivery agent has "
                    + "collected your parcel from the pickup "
                    + "location. The parcel will normally move "
                    + "to the next stage, which is In Transit.";
        }

        /*
         * -------------------------------------------------
         * OUT FOR DELIVERY MEANING
         * -------------------------------------------------
         */

        if (question.contains("out for delivery")
                && (question.contains("meaning")
                || question.contains("what does")
                || question.contains("means")
                || question.contains("mean"))) {

            return "Out for Delivery means your parcel has "
                    + "reached the final delivery stage and "
                    + "is currently with the delivery agent "
                    + "for delivery to the destination.";
        }

        /*
         * -------------------------------------------------
         * BOOKED MEANING
         * -------------------------------------------------
         */

        if (question.contains("booked")
                && (question.contains("meaning")
                || question.contains("what does")
                || question.contains("means")
                || question.contains("mean"))) {

            return "Booked means your parcel has been registered "
                    + "in the ParcelHub system and is waiting "
                    + "for the pickup process to begin.";
        }

        /*
         * -------------------------------------------------
         * DELIVERED MEANING
         * -------------------------------------------------
         */

        if (question.contains("delivered")
                && (question.contains("meaning")
                || question.contains("what does")
                || question.contains("means")
                || question.contains("mean"))) {

            return "Delivered means the parcel has successfully "
                    + "reached its destination and the delivery "
                    + "process has been completed.";
        }

        /*
         * -------------------------------------------------
         * CANCELLED MEANING
         * -------------------------------------------------
         */

        if (question.contains("cancelled")
                && (question.contains("meaning")
                || question.contains("what does")
                || question.contains("means")
                || question.contains("mean"))) {

            return "Cancelled means the parcel delivery has "
                    + "been cancelled and will no longer continue "
                    + "through the normal delivery process.";
        }

        /*
         * -------------------------------------------------
         * NO PARCELS
         * -------------------------------------------------
         */

        if (parcels.isEmpty()) {

            if (question.contains("parcel")
                    || question.contains("shipment")
                    || question.contains("tracking")
                    || question.contains("status")
                    || question.contains("where")) {

                return "You currently don't have any shipments "
                        + "registered with ParcelHub.";
            }
        }

        /*
         * -------------------------------------------------
         * LATEST PARCEL
         * -------------------------------------------------
         */

        Parcel latestParcel = null;

        if (!parcels.isEmpty()) {
            latestParcel =
                    parcels.get(parcels.size() - 1);
        }

        /*
         * -------------------------------------------------
         * WHERE IS MY PARCEL?
         * -------------------------------------------------
         */

        if (question.contains("where")
                || question.contains("where is my")
                || question.contains("track my")
                || question.contains("tracking status")
                || question.contains("shipment status")
                || question.contains("parcel status")) {

            if (latestParcel == null) {
                return "You currently don't have any shipments "
                        + "registered with ParcelHub.";
            }

            String trackingNumber =
                    latestParcel.getTrackingNumber();

            String status =
                    latestParcel.getStatus() != null
                            ? latestParcel.getStatus().name()
                            : "UNKNOWN";

            String readableStatus =
                    formatStatus(status);

            return "Your latest shipment "
                    + trackingNumber
                    + " is currently "
                    + readableStatus
                    + ". It is being delivered from "
                    + latestParcel.getPickupAddress()
                    + " to "
                    + latestParcel.getDeliveryAddress()
                    + ".";
        }

        /*
         * -------------------------------------------------
         * TRACKING NUMBER
         * -------------------------------------------------
         */

        if (question.contains("tracking number")
                || question.contains("tracking id")
                || question.contains("tracking code")) {

            if (latestParcel == null) {
                return "You currently don't have any shipments "
                        + "registered with ParcelHub.";
            }

            return "Your latest tracking number is "
                    + latestParcel.getTrackingNumber()
                    + ". You can use this tracking number "
                    + "to identify your shipment.";
        }

        /*
         * -------------------------------------------------
         * IN TRANSIT COUNT
         * -------------------------------------------------
         */

        if (question.contains("in transit")
                || question.contains("moving")
                || question.contains("on the way")) {

            long count = parcels.stream()
                    .filter(parcel ->
                            parcel.getStatus() != null
                                    && (
                                    parcel.getStatus()
                                            .name()
                                            .equals("IN_TRANSIT")

                                    || parcel.getStatus()
                                            .name()
                                            .equals("PICKED_UP")

                                    || parcel.getStatus()
                                            .name()
                                            .equals("OUT_FOR_DELIVERY")
                            )
                    )
                    .count();

            if (count == 0) {
                return "You currently don't have any shipments "
                        + "in the active delivery process.";
            }

            return "You currently have "
                    + count
                    + " shipment(s) in the active delivery "
                    + "process.";
        }

        /*
         * -------------------------------------------------
         * DELIVERED COUNT
         * -------------------------------------------------
         */

        if (question.contains("how many")
                && question.contains("delivered")) {

            long count = parcels.stream()
                    .filter(parcel ->
                            parcel.getStatus() != null
                                    && parcel.getStatus()
                                    .name()
                                    .equals("DELIVERED")
                    )
                    .count();

            return "You have "
                    + count
                    + " delivered shipment(s) in ParcelHub.";
        }

        /*
         * -------------------------------------------------
         * DELIVERED SHIPMENTS
         * -------------------------------------------------
         */

        if (question.equals("delivered")
                || question.contains("my delivered parcels")
                || question.contains("my delivered shipments")) {

            long count = parcels.stream()
                    .filter(parcel ->
                            parcel.getStatus() != null
                                    && parcel.getStatus()
                                    .name()
                                    .equals("DELIVERED")
                    )
                    .count();

            return "You currently have "
                    + count
                    + " delivered shipment(s).";
        }

        /*
         * -------------------------------------------------
         * PENDING / BOOKED
         * -------------------------------------------------
         */

        if (question.contains("pending")
                || question.contains("waiting")
                || question.contains("booked parcels")) {

            long count = parcels.stream()
                    .filter(parcel ->
                            parcel.getStatus() != null
                                    && parcel.getStatus()
                                    .name()
                                    .equals("BOOKED")
                    )
                    .count();

            return "You currently have "
                    + count
                    + " pending shipment(s) waiting "
                    + "for the next delivery stage.";
        }

        /*
         * -------------------------------------------------
         * DELIVERY TIME
         * -------------------------------------------------
         */

        if (question.contains("how long")
                || question.contains("delivery time")
                || question.contains("how much time")
                || question.contains("when will")
                || question.contains("when will my parcel")) {

            return "Delivery time depends on the pickup and "
                    + "destination locations, delivery route, "
                    + "and current shipment status. You can "
                    + "track your parcel from the ParcelHub "
                    + "dashboard for the latest status.";
        }

        /*
         * -------------------------------------------------
         * PICKUP
         * -------------------------------------------------
         */

        if (question.contains("pickup")
                || question.contains("pick up")
                || question.contains("collect my parcel")) {

            return "After a parcel is booked, the next major "
                    + "stage is pickup. Once the delivery agent "
                    + "collects it, the status changes to "
                    + "Picked Up and the shipment continues "
                    + "through the delivery process.";
        }

        /*
         * -------------------------------------------------
         * DELIVERY PROCESS
         * -------------------------------------------------
         */

        if (question.contains("delivery process")
                || question.contains("delivery stages")
                || question.contains("stages of delivery")
                || question.contains("how delivery works")) {

            return "The ParcelHub delivery process generally "
                    + "follows these stages:\n\n"
                    + "1. 📋 Booked\n"
                    + "2. 📦 Picked Up\n"
                    + "3. 🚚 In Transit\n"
                    + "4. 🛵 Out for Delivery\n"
                    + "5. ✅ Delivered";
        }

        /*
         * -------------------------------------------------
         * MY PARCELS COUNT
         * -------------------------------------------------
         */

        if (question.contains("how many parcels")
                || question.contains("how many shipments")
                || question.contains("my parcels")
                || question.contains("my shipments")) {

            return "You currently have "
                    + parcels.size()
                    + " shipment(s) registered with ParcelHub.";
        }

        /*
         * -------------------------------------------------
         * LATEST PARCEL INFORMATION
         * -------------------------------------------------
         */

        if (question.contains("latest parcel")
                || question.contains("latest shipment")
                || question.contains("recent parcel")) {

            if (latestParcel == null) {
                return "You currently don't have any shipments "
                        + "registered with ParcelHub.";
            }

            String status =
                    latestParcel.getStatus() != null
                            ? formatStatus(
                            latestParcel
                                    .getStatus()
                                    .name()
                    )
                            : "Unknown";

            return "Your latest shipment is "
                    + latestParcel.getTrackingNumber()
                    + ".\n\n"
                    + "Status: "
                    + status
                    + "\n"
                    + "Receiver: "
                    + latestParcel.getReceiverName()
                    + "\n"
                    + "From: "
                    + latestParcel.getPickupAddress()
                    + "\n"
                    + "To: "
                    + latestParcel.getDeliveryAddress();
        }

        /*
         * -------------------------------------------------
         * FALLBACK
         * -------------------------------------------------
         */

        return "I can help you with your ParcelHub "
                + "shipments and delivery process.\n\n"
                + "You can ask me things like:\n"
                + "• Where is my parcel?\n"
                + "• What is my tracking number?\n"
                + "• How many parcels do I have?\n"
                + "• What does In Transit mean?\n"
                + "• How long does delivery take?\n"
                + "• What happens after pickup?\n"
                + "• How many parcels have been delivered?";
    }

    /*
     * -----------------------------------------------------
     * FORMAT STATUS
     * -----------------------------------------------------
     */

    private String formatStatus(String status) {

        return switch (status) {

            case "BOOKED" ->
                    "Booked";

            case "PICKED_UP" ->
                    "Picked Up";

            case "IN_TRANSIT" ->
                    "In Transit";

            case "OUT_FOR_DELIVERY" ->
                    "Out for Delivery";

            case "DELIVERED" ->
                    "Delivered";

            case "CANCELLED" ->
                    "Cancelled";

            default ->
                    "Unknown";
        };
    }
}