package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.dto.UserResponseDto;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.model.enums.Role;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.repository.UserRepository;
import com.example.eventmanagement.service.BookingService;
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private RegistrationRepository registrationRepository;
    @Autowired private BookingService bookingService;
    @Autowired private EventService eventService;

    // ===== Dashboard =====
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        long totalEvents = eventRepository.count();
        long publishedEvents = eventRepository.findByStatus(EventStatus.PUBLISHED,
                PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
        long totalUsers = userRepository.count();
        long totalRegistrations = registrationRepository.count();

        var top5 = eventRepository.findTop5ByOrderByCurrentAttendeesDesc();
        return ResponseEntity.ok(Map.of(
                "totalEvents", totalEvents,
                "publishedEvents", publishedEvents,
                "totalUsers", totalUsers,
                "totalRegistrations", totalRegistrations,
                "top5Events", top5
        ));
    }

    // ===== User Management =====
    @GetMapping("/users")
    public ResponseEntity<?> listUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "0") int page) {
        Role roleFilter = null;
        if (!role.isEmpty()) {
            try { roleFilter = Role.valueOf(role); } catch (Exception ignored) {}
        }
        PageRequest pageable = PageRequest.of(page, 10, Sort.by("createdAt").descending());
        Page<User> users = userService.getAllUsers(keyword, roleFilter, pageable);
        var dtoList = users.getContent().stream().map(UserResponseDto::fromEntity).toList();
        return ResponseEntity.ok(Map.of(
                "content", dtoList,
                "totalPages", users.getTotalPages(),
                "currentPage", page,
                "totalElements", users.getTotalElements(),
                "roles", Role.values()
        ));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserDetail(@PathVariable String id) {
        try {
            User user = userService.getById(id);
            long eventsCreated = eventRepository.findByOrganizerId(id, PageRequest.of(0, 1)).getTotalElements();
            long registrations = registrationRepository.findByUserId(id).size();
            return ResponseEntity.ok(Map.of(
                    "user", UserResponseDto.fromEntity(user),
                    "eventsCreated", eventsCreated,
                    "registrations", registrations
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/toggle")
    public ResponseEntity<?> toggleUser(@PathVariable String id, Authentication auth) {
        try {
            // Bảo vệ: không cho khóa chính mình hoặc admin khác
            User currentUser = userService.findByEmail(auth.getName());
            User targetUser = userService.getById(id);
            if (currentUser.getId().equals(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể khóa tài khoản của chính mình"));
            }
            if (targetUser.getRole() == Role.ADMIN) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể khóa tài khoản admin khác"));
            }
            userService.toggleEnabled(id);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái tài khoản"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable String id, @RequestParam String role, Authentication auth) {
        try {
            // Bảo vệ: không cho đổi role của chính mình hoặc admin khác
            User currentUser = userService.findByEmail(auth.getName());
            User targetUser = userService.getById(id);
            if (currentUser.getId().equals(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể đổi quyền của chính mình"));
            }
            if (targetUser.getRole() == Role.ADMIN) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể đổi quyền của admin khác"));
            }
            userService.changeRole(id, Role.valueOf(role));
            return ResponseEntity.ok(Map.of("message", "Đã đổi quyền thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== Event Management (Admin) =====
    @GetMapping("/events")
    public ResponseEntity<?> listAllEvents(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page) {
        EventStatus eventStatus = null;
        if (!status.isEmpty()) {
            try { eventStatus = EventStatus.valueOf(status); } catch (Exception ignored) {}
        }
        PageRequest pageable = PageRequest.of(page, 10, Sort.by("createdAt").descending());
        var events = eventService.getAllEvents(keyword, eventStatus, pageable);
        return ResponseEntity.ok(Map.of(
                "content", events.getContent(),
                "totalPages", events.getTotalPages(),
                "currentPage", page,
                "totalElements", events.getTotalElements()
        ));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable String id) {
        try {
            eventService.adminCancelOrDeleteEvent(id);
            return ResponseEntity.ok(Map.of("message", "Đã hủy/xóa sự kiện thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/events/{id}/registrations")
    public ResponseEntity<?> eventRegistrations(@PathVariable String id) {
        List<Registration> regs = registrationRepository.findByEventId(id);
        List<Map<String, Object>> bookings = bookingService.getBookingsByEvent(id).stream().map(b -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", b.getId());
            m.put("userFullName", b.getUserFullName());
            m.put("userEmail", b.getUserEmail());
            m.put("zoneName", b.getZoneName());
            m.put("quantity", b.getQuantity());
            m.put("finalAmount", b.getFinalAmount());
            m.put("status", b.getStatus());
            m.put("createdAt", b.getCreatedAt());
            m.put("type", "BOOKING");
            return m;
        }).toList();
        return ResponseEntity.ok(Map.of("registrations", regs, "bookings", bookings));
    }

    // ===== Revenue =====
    @GetMapping("/revenue")
    public ResponseEntity<?> revenue() {
        long total = bookingService.getTotalRevenue();
        List<Map<String, Object>> byEvent = bookingService.getRevenueByEvent();
        return ResponseEntity.ok(Map.of(
                "totalRevenue", total,
                "revenueByEvent", byEvent
        ));
    }

    // ===== Reports =====
    @GetMapping("/reports")
    public ResponseEntity<?> reports() {
        return ResponseEntity.ok(eventService.getReportData());
    }
}
