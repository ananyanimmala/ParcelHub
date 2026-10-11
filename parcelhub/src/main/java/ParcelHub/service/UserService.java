package ParcelHub.service;

import ParcelHub.entity.User;
import ParcelHub.enums.UserRole;
import ParcelHub.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(User user) {

        // Check whether email already exists
        if (userRepository.existsByEmail(user.getEmail())) {

            throw new RuntimeException(
                    "Email already registered"
            );
        }

        // Every new registration is CUSTOMER
        // Role supplied by the client is ignored.
        user.setRole(UserRole.CUSTOMER);

        // Encrypt password before saving
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        return userRepository.save(user);
    }

    public User getUserByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );
    }
}