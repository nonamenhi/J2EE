package com.example.eventmanagement.service.impl;

import com.example.eventmanagement.model.Booking;
import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.SeatZone;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.repository.BookingRepository;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.UserRepository;
import com.example.eventmanagement.service.BookingService;
import com.example.eventmanagement.service.QrCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired private BookingRepository bookingRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private MongoTemplate mongoTemplate;
    @Autowired private QrCodeService qrCodeService;

    @Override
    public Booking createBooking(String eventId, String zoneId, int quantity, String userEmail) {
        // 1. Lấy event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sự kiện"));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new IllegalStateException("Sự kiện không nhận đặt vé lúc này");
        }
        if (event.isFree()) {
            throw new IllegalStateException("Sự kiện miễn phí - hãy dùng chức năng đăng ký");
        }

        // 2. Lấy zone
        SeatZone zone = event.getSeatZones().stream()
                .filter(z -> z.getId().equals(zoneId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khu vực: " + zoneId));

        if (quantity <= 0) throw new IllegalArgumentException("Số lượng phải lớn hơn 0");

        int available = zone.getAvailableSeats();
        if (available < quantity) {
            throw new IllegalStateException("Khu " + zone.getName() + " chỉ còn " + available + " chỗ");
        }

        // 3. Lấy user và kiểm tra balance
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        long totalAmount = zone.getPrice() * quantity;
        if (user.getBalance() < totalAmount) {
            throw new IllegalStateException(
                "Số dư không đủ. Cần: " + totalAmount + "đ, Hiện có: " + user.getBalance() + "đ");
        }

        // 4. Trừ balance user (atomic update)
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("id").is(user.getId())),
                new Update().inc("balance", -totalAmount),
                User.class
        );

        // 5. Tăng soldSeats cho zone (cập nhật trong mảng embedded)
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("id").is(eventId)
                        .and("seatZones.id").is(zoneId)),
                new Update().inc("seatZones.$.soldSeats", quantity)
                        .inc("currentAttendees", quantity),
                Event.class
        );

        // 6. Tạo booking
        Booking booking = new Booking();
        booking.setEventId(eventId);
        booking.setEventTitle(event.getTitle());
        booking.setUserId(user.getId());
        booking.setUserEmail(user.getEmail());
        booking.setUserFullName(user.getFullName());
        booking.setZoneId(zoneId);
        booking.setZoneName(zone.getName());
        booking.setQuantity(quantity);
        booking.setUnitPrice(zone.getPrice());
        booking.setTotalAmount(totalAmount);
        booking.setFinalAmount(totalAmount);
        booking.setStatus("CONFIRMED");
        booking.setCreatedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);

        // Generate QR code sau khi đã có ID
        try {
            String qr = qrCodeService.generateQrBase64(saved.getId(), eventId, user.getId());
            saved.setQrCodeBase64(qr);
            bookingRepository.save(saved);
        } catch (Exception e) {
            System.err.println("QR generation failed for booking: " + e.getMessage());
        }

        return saved;
    }

    @Override
    public void cancelBooking(String bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đặt chỗ"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!booking.getUserId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Không có quyền hủy đặt chỗ này");
        }
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new IllegalStateException("Đặt chỗ đã bị hủy trước đó");
        }

        // Hoàn tiền
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("id").is(user.getId())),
                new Update().inc("balance", booking.getFinalAmount()),
                User.class
        );

        // Giảm soldSeats và currentAttendees
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("id").is(booking.getEventId())
                        .and("seatZones.id").is(booking.getZoneId())),
                new Update().inc("seatZones.$.soldSeats", -booking.getQuantity())
                        .inc("currentAttendees", -booking.getQuantity()),
                Event.class
        );

        booking.setStatus("CANCELLED");
        booking.setCancelledAt(LocalDateTime.now());
        bookingRepository.save(booking);
    }

    @Override
    public List<Booking> getBookingsByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return bookingRepository.findByUserId(user.getId());
    }

    @Override
    public List<Booking> getBookingsByEvent(String eventId) {
        return bookingRepository.findByEventId(eventId);
    }

    @Override
    public long getTotalRevenue() {
        return bookingRepository.findAll().stream()
                .filter(b -> "CONFIRMED".equals(b.getStatus()))
                .mapToLong(Booking::getFinalAmount)
                .sum();
    }

    @Override
    public List<Map<String, Object>> getRevenueByEvent() {
        List<Booking> confirmed = bookingRepository.findAll().stream()
                .filter(b -> "CONFIRMED".equals(b.getStatus()))
                .collect(Collectors.toList());

        Map<String, List<Booking>> grouped = confirmed.stream()
                .collect(Collectors.groupingBy(Booking::getEventId));

        return grouped.entrySet().stream().map(entry -> {
            List<Booking> bookings = entry.getValue();
            long revenue = bookings.stream().mapToLong(Booking::getFinalAmount).sum();
            int ticketsSold = bookings.stream().mapToInt(Booking::getQuantity).sum();
            Map<String, Object> row = new HashMap<>();
            row.put("eventId", entry.getKey());
            row.put("eventTitle", bookings.get(0).getEventTitle());
            row.put("revenue", revenue);
            row.put("ticketsSold", ticketsSold);
            row.put("bookingCount", bookings.size());
            return row;
        }).sorted((a, b) -> Long.compare((long) b.get("revenue"), (long) a.get("revenue")))
          .collect(Collectors.toList());
    }
}
