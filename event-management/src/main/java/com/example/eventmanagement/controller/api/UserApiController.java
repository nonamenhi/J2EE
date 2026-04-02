package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.model.User;
import com.example.eventmanagement.repository.BookingRepository;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.repository.ReviewRepository;
import com.example.eventmanagement.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserApiController {

    @Autowired private UserRepository userRepository;
    @Autowired private RegistrationRepository registrationRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    record UpdateProfileRequest(@NotBlank String fullName) {}
    record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank String newPassword) {}

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            Authentication auth,
            @Valid @RequestBody UpdateProfileRequest req) {

        if (auth == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Bạn cần đăng nhập để thực hiện thao tác này"));
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(req.fullName());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "data", Map.of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name(),
                        "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
                )
        ));
    }

    @GetMapping("/me/stats")
    public ResponseEntity<?> getUserStats(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        long registrations = registrationRepository.findByUserId(user.getId()).size();
        long bookings = bookingRepository.findByUserId(user.getId()).size();
        long eventsCreated = eventRepository.findByOrganizerId(user.getId(), PageRequest.of(0, 1)).getTotalElements();
        long reviews = reviewRepository.countByUserId(user.getId());

        return ResponseEntity.ok(Map.of(
                "registrations", registrations,
                "bookings", bookings,
                "eventsCreated", eventsCreated,
                "reviews", reviews,
                "balance", user.getBalance()
        ));
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            Authentication auth,
            @Valid @RequestBody ChangePasswordRequest req) {

        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu hiện tại không đúng"));
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}