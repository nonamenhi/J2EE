package com.example.eventmanagement.repository;

import com.example.eventmanagement.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByEventIdOrderByCreatedAtDesc(String eventId);
    boolean existsByEventIdAndUserId(String eventId, String userId);
}
