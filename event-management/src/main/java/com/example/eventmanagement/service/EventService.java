package com.example.eventmanagement.service;

import com.example.eventmanagement.dto.EventDto;
import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public interface EventService {
    Page<Event> getPublishedEvents(String keyword, String tag, String location, String category, LocalDate dateFrom, LocalDate dateTo, Pageable pageable);
    Event getEventById(String id);
    Event createEvent(EventDto dto, String organizerEmail, MultipartFile bannerFile);
    Event updateEvent(String id, EventDto dto, String currentUserEmail, MultipartFile bannerFile);
    void cancelOrDeleteEvent(String id, String currentUserEmail);
    Page<Event> getOrganizerEvents(String organizerEmail, EventStatus status, Pageable pageable);
    List<String> getAllTags();
    List<String> getAllLocations();

    // ---- Admin methods ----
    Page<Event> getAllEvents(String keyword, EventStatus status, Pageable pageable);
    void adminCancelOrDeleteEvent(String eventId);
    java.util.Map<String, Object> getReportData();

    // ---- Homepage sections ----
    List<Event> getTrendingEvents();
    List<Event> getFeaturedEvents();
    List<Event> getRelatedEvents(String eventId);
}
