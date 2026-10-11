package ParcelHub.controller;

import ParcelHub.dto.UserDTO;
import ParcelHub.entity.User;
import ParcelHub.enums.UserRole;
import ParcelHub.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Get all users
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<UserDTO> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get user by ID
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(
            @PathVariable Long id) {

        return userRepository.findById(id)
                .map(user ->
                        ResponseEntity.ok(convertToDTO(user)))
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // Update user role
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/role")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable Long id,
            @RequestParam UserRole role) {

        return userRepository.findById(id)
                .map(user -> {

                    user.setRole(role);

                    User updatedUser =
                            userRepository.save(user);

                    return ResponseEntity.ok(
                            convertToDTO(updatedUser)
                    );
                })
                .orElse(
                        ResponseEntity.notFound().build()
                );
    }

    // Delete user
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id) {

        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        userRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }

    // Convert User entity to UserDTO
    private UserDTO convertToDTO(User user) {

        return new UserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}