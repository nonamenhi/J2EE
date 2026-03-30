package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Review;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.repository.ReviewRepository;
import com.example.eventmanagement.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}/reviews")
public class ReviewApiController {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private RegistrationRepository registrationRepository;
    @Autowired private UserRepository userRepository;

    record ReviewRequest(
            @Min(1) @Max(5) int rating,
            @NotBlank String comment
    ) {}

    @GetMapping
    public ResponseEntity<?> getReviews(@PathVariable String eventId) {
        List<Review> reviews = reviewRepository.findByEventIdOrderByCreatedAtDesc(eventId);
        return ResponseEntity.ok(Map.of("data", reviews));
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @PathVariable String eventId,
            Authentication auth,
            @Valid @RequestBody ReviewRequest req) {

        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Chưa đăng nhập"));
        }

        User user = userRepository.findByEmail(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Người dùng không hợp lệ"));
        }

        Event event = eventRepository.findById(eventId).orElse(null);
        if (event == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Không tìm thấy sự kiện"));
        }

        if (event.getEndDate() == null || event.getEndDate().isAfter(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Chỉ có thể đánh giá sau khi sự kiện kết thúc"));
        }

        boolean hasRegistered = registrationRepository.existsByEventIdAndUserId(eventId, user.getId());
        if (!hasRegistered && !"ADMIN".equals(user.getRole().name())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn chưa tham gia sự kiện này nên không thể đánh giá."));
        }

        if (reviewRepository.existsByEventIdAndUserId(eventId, user.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã đánh giá sự kiện này rồi."));
        }

        Review review = new Review();
        review.setEventId(eventId);
        review.setUserId(user.getId());
        review.setUserFullName(user.getFullName());
        review.setRating(req.rating());
        review.setComment(req.comment());
        review.setCreatedAt(LocalDateTime.now());
        
        reviewRepository.save(review);

        return ResponseEntity.ok(Map.of("message", "Đánh giá thành công!", "data", review));
    }
}
