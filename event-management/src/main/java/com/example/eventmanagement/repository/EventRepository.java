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
    Page<Event> findByStatusAndTitleContaining1(EventStatus status, String keyword, Pageable pageable);

    @Query("{ 'status': ?0, 'tags': ?1 }")
    Page<Event> findByStatusAndTagsContaining(EventStatus status, String tag, Pageable pageable);

    @Query("{ 'status': ?0, 'title': { $regex: ?1, $options: 'i' }, 'tags': ?2 }")
    Page<Event> findByStatusAndTitleContainingAndTagsContaining(EventStatus status, String keyword, String tag, Pageable pageable);

    Page<Event> findByOrganizerId(String organizerId, Pageable pageable);

    Page<Event> findByOrganizerIdAndStatus(String organizerId, EventStatus status, Pageable pageable);

    List<Event> findTop5ByOrderByCurrentAttendeesDesc();

    @Query("{ 'tags': { $exists: true } }")
    List<Event> findAllTaggedEvents();

    // ---- Admin queries ----
    @Query("{ 'title': { $regex: ?0, $options: 'i' } }")
    Page<Event> findByTitleContaining(String keyword, Pageable pageable);

    @Query("{ 'status': ?0, 'title': { $regex: ?1, $options: 'i' } }")
    Page<Event> findByStatusAndTitleContaining(EventStatus status, String keyword, Pageable pageable);

    long countByStatus(EventStatus status);

    // ---- Featured & Trending ----
    List<Event> findByIsFeaturedTrueAndStatus(EventStatus status);

    List<Event> findTop10ByStatusOrderByCurrentAttendeesDesc(EventStatus status);

    // ---- Related events (same category, exclude self) ----
    @Query("{ 'status': 'PUBLISHED', 'category': ?0, '_id': { $ne: { $oid: ?1 } } }")
    List<Event> findRelatedByCategory(String category, String excludeId, Pageable pageable);

    @Query("{ 'status': 'PUBLISHED', 'tags': { $in: ?0 }, '_id': { $ne: { $oid: ?1 } } }")
    List<Event> findRelatedByTags(List<String> tags, String excludeId, Pageable pageable);
}
