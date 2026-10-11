package ParcelHub.controller;

import ParcelHub.dto.AiChatRequest;
import ParcelHub.dto.AiChatResponse;
import ParcelHub.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PreAuthorize(
            "hasAnyRole('CUSTOMER', 'DELIVERY_AGENT', 'ADMIN')"
    )
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @RequestBody AiChatRequest request,
            Authentication authentication) {

        if (request.getMessage() == null ||
                request.getMessage().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body(
                            new AiChatResponse(
                                    "Please enter a message."
                            )
                    );
        }

        String email = authentication.getName();

        String response =
                aiService.generateResponse(
                        email,
                        request.getMessage()
                );

        return ResponseEntity.ok(
                new AiChatResponse(response)
        );
    }
}