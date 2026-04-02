package com.example.eventmanagement.dto;

import com.example.eventmanagement.model.Booking;

import java.time.LocalDateTime;

public class BookingDto {
    private String id;
    private String eventId;
    private String eventTitle;
    private String userId;
    private String userEmail;
    private String userFullName;
    private String zoneId;
    private String zoneName;
    private int quantity;
    private long unitPrice;
    private long totalAmount;
    private long finalAmount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;

    public BookingDto() {}

    public static BookingDto fromEntity(Booking b) {
        BookingDto dto = new BookingDto();
        dto.setId(b.getId());
        dto.setEventId(b.getEventId());
        dto.setEventTitle(b.getEventTitle());
        dto.setUserId(b.getUserId());
        dto.setUserEmail(b.getUserEmail());
        dto.setUserFullName(b.getUserFullName());
        dto.setZoneId(b.getZoneId());
        dto.setZoneName(b.getZoneName());
        dto.setQuantity(b.getQuantity());
        dto.setUnitPrice(b.getUnitPrice());
        dto.setTotalAmount(b.getTotalAmount());
        dto.setFinalAmount(b.getFinalAmount());
        dto.setStatus(b.getStatus());
        dto.setCreatedAt(b.getCreatedAt());
        dto.setCancelledAt(b.getCancelledAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getEventTitle() { return eventTitle; }
    public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }

    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }

    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public long getUnitPrice() { return unitPrice; }
    public void setUnitPrice(long unitPrice) { this.unitPrice = unitPrice; }

    public long getTotalAmount() { return totalAmount; }
    public void setTotalAmount(long totalAmount) { this.totalAmount = totalAmount; }

    public long getFinalAmount() { return finalAmount; }
    public void setFinalAmount(long finalAmount) { this.finalAmount = finalAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
