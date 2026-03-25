package com.example.eventmanagement.repository;

import com.example.eventmanagement.model.Registration;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends MongoRepository<Registration, String> {

    Optional<Registration> findByEventIdAndUserId(String eventId, String userId);

    List<Registration> findByUserId(String userId);

    List<Registration> findByEventId(String eventId);

    long countByEventId(String eventId);

    boolean existsByEventIdAndUserId(String eventId, String userId);
}
