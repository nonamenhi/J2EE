package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.model.User;
import com.example.eventmanagement.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserApiController {

    @Autowired private UserRepository userRepository;

    record UpdateProfileRequest(@NotBlank String fullName) {}

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
                        "role", user.getRole().name()
                )
        ));
    }
}