package com.example.eventmanagement.controller.api;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class RegistrationApiController {

    @Autowired private RegistrationService registrationService;
    @Autowired private RegistrationRepository registrationRepository;
    @Autowired private EventService eventService;

    @PostMapping("/api/events/{id}/register")
    public ResponseEntity<?> register(@PathVariable String id, Authentication auth) {
        try {
            Registration reg = registrationService.register(id, auth.getName());
            return ResponseEntity.ok(Map.of(
                "message", "Đăng ký tham dự thành công! 🎉",
                "registrationId", reg.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/registrations/{id}")
    public ResponseEntity<?> cancel(@PathVariable String id, Authentication auth) {
        try {
            registrationService.cancel(id, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Đã hủy đăng ký thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/my-registrations")
    public ResponseEntity<?> myRegistrations(Authentication auth) {
        List<Registration> registrations = registrationService.getByUserEmail(auth.getName());
        List<Map<String, Object>> result = registrations.stream().map(r -> {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", r.getId());
            item.put("eventId", r.getEventId());
            item.put("status", r.getStatus());
            item.put("registeredAt", r.getRegisteredAt());
            item.put("qrCodeBase64", r.getQrCodeBase64());
            item.put("checkedIn", r.isCheckedIn());
            item.put("checkedInAt", r.getCheckedInAt());
            try {
                Event e = eventService.getEventById(r.getEventId());
                item.put("eventTitle", e.getTitle());
                item.put("eventLocation", e.getLocation());
                item.put("eventStartDate", e.getStartDate());
                item.put("eventBanner", e.getBannerImagePath());
            } catch (Exception ignored) {}
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * ORGANIZER check-in: xác nhận người tham dự theo registrationId
     */
    @PostMapping("/api/checkin/{registrationId}")
    public ResponseEntity<?> checkIn(@PathVariable String registrationId, Authentication auth) {
        try {
            Registration reg = registrationRepository.findById(registrationId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy vé đăng ký"));

            if ("CANCELLED".equals(reg.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vé đã bị hủy"));
            }
            if (reg.isCheckedIn()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Vé này đã được check-in rồi",
                    "checkedInAt", reg.getCheckedInAt().toString()
                ));
            }

            reg.setCheckedIn(true);
            reg.setCheckedInAt(LocalDateTime.now());
            registrationRepository.save(reg);

            return ResponseEntity.ok(Map.of(
                "message", "✅ Check-in thành công!",
                "userFullName", reg.getUserFullName(),
                "userEmail", reg.getUserEmail(),
                "eventId", reg.getEventId(),
                "checkedInAt", reg.getCheckedInAt().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Lấy QR code của một registration (chỉ chính chủ mới xem được)
     */
    @GetMapping("/api/registrations/{id}/qr")
    public ResponseEntity<?> getQrCode(@PathVariable String id, Authentication auth) {
        try {
            Registration reg = registrationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký"));

            // Chỉ chủ sở hữu mới xem được
            if (!reg.getUserEmail().equals(auth.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Không có quyền truy cập"));
            }

            return ResponseEntity.ok(Map.of(
                "qrCodeBase64", reg.getQrCodeBase64() != null ? reg.getQrCodeBase64() : "",
                "registrationId", reg.getId(),
                "status", reg.getStatus(),
                "checkedIn", reg.isCheckedIn()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

