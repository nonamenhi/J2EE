package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventApiController {

    @Autowired private EventService eventService;
    @Autowired private RegistrationService registrationService;

    @GetMapping
    public ResponseEntity<?> listEvents(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String tag,
            @RequestParam(defaultValue = "") String location,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Event> events = eventService.getPublishedEvents(keyword, tag, location, category, dateFrom, dateTo, pageable);
        List<String> allTags = eventService.getAllTags();
        List<String> allLocations = eventService.getAllLocations();

        return ResponseEntity.ok(Map.of(
                "content", events.getContent(),
                "totalPages", events.getTotalPages(),
                "totalElements", events.getTotalElements(),
                "currentPage", page,
                "allTags", allTags,
                "allLocations", allLocations
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEvent(@PathVariable String id, Authentication auth) {
        Event event = eventService.getEventById(id);
        int spotsLeft = event.getMaxCapacity() == 0
                ? Integer.MAX_VALUE
                : event.getMaxCapacity() - event.getCurrentAttendees();
        boolean alreadyRegistered = auth != null && registrationService.isRegistered(id, auth.getName());
        return ResponseEntity.ok(Map.of(
                "event", event,
                "spotsLeft", spotsLeft,
                "alreadyRegistered", alreadyRegistered
        ));
    }

    @GetMapping("/trending")
    public ResponseEntity<?> trendingEvents() {
        var events = eventService.getTrendingEvents();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/featured")
    public ResponseEntity<?> featuredEvents() {
        var events = eventService.getFeaturedEvents();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<?> relatedEvents(@PathVariable String id) {
        var events = eventService.getRelatedEvents(id);
        return ResponseEntity.ok(events);
    }
}
