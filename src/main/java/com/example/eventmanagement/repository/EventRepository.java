package com.example.eventmanagement.repository;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface EventRepository extends MongoRepository<Event, String> {

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    @Query("{ 'status': ?0, 'title': { $regex: ?1, $options: 'i' } }")
    Page<Event> findByStatusAndTitleContaining(EventStatus status, String keyword, Pageable pageable);

    @Query("{ 'status': ?0, 'tags': ?1 }")
    Page<Event> findByStatusAndTagsContaining(EventStatus status, String tag, Pageable pageable);

    @Query("{ 'status': ?0, 'title': { $regex: ?1, $options: 'i' }, 'tags': ?2 }")
    Page<Event> findByStatusAndTitleContainingAndTagsContaining(EventStatus status, String keyword, String tag, Pageable pageable);

    Page<Event> findByOrganizerId(String organizerId, Pageable pageable);

    Page<Event> findByOrganizerIdAndStatus(String organizerId, EventStatus status, Pageable pageable);

    List<Event> findTop5ByOrderByCurrentAttendeesDesc();

    @Query("{ 'tags': { $exists: true } }")
    List<Event> findAllTaggedEvents();
}
