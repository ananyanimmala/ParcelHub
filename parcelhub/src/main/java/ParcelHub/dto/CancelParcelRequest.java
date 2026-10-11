package ParcelHub.dto;

import jakarta.validation.constraints.NotBlank;

public class CancelParcelRequest {

    @NotBlank(message = "Cancellation reason is required")
    private String reason;


    public CancelParcelRequest() {
    }


    public String getReason() {
        return reason;
    }


    public void setReason(String reason) {
        this.reason = reason;
    }
}