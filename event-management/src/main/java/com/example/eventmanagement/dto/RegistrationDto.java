package com.example.eventmanagement.dto;

import com.example.eventmanagement.model.Registration;

import java.time.LocalDateTime;

public class RegistrationDto {
    private String id;
    private String eventId;
    private String userId;
    private String userFullName;
    private String userEmail;
    private LocalDateTime registeredAt;
    private String status;

    public RegistrationDto() {}

    public static RegistrationDto fromEntity(Registration r) {
        RegistrationDto dto = new RegistrationDto();
        dto.setId(r.getId());
        dto.setEventId(r.getEventId());
        dto.setUserId(r.getUserId());
        dto.setUserFullName(r.getUserFullName());
        dto.setUserEmail(r.getUserEmail());
        dto.setRegisteredAt(r.getRegisteredAt());
        dto.setStatus(r.getStatus());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
