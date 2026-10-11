package ParcelHub.controller;

import ParcelHub.dto.AuthResponse;
import ParcelHub.dto.LoginRequest;
import ParcelHub.entity.User;
import ParcelHub.security.JwtService;
import ParcelHub.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserService userService,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {

        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        try {

            User savedUser = userService.registerUser(user);

            return ResponseEntity.ok(
                    new AuthResponse(
                            null,
                            savedUser.getName(),
                            savedUser.getEmail(),
                            savedUser.getRole().name()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity.badRequest()
                    .body(e.getMessage());
        }
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        try {

            User user = userService.getUserByEmail(request.getEmail());

            if (!passwordEncoder.matches(
                    request.getPassword(),
                    user.getPassword())) {

                return ResponseEntity
                        .status(401)
                        .body("Invalid email or password");
            }

            String token = jwtService.generateToken(
                    user.getEmail(),
                    user.getRole().name()
            );

            return ResponseEntity.ok(
                    new AuthResponse(
                            token,
                            user.getName(),
                            user.getEmail(),
                            user.getRole().name()
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(401)
                    .body("Invalid email or password");
        }
    }
}