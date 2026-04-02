package com.example.eventmanagement.config;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.model.SeatZone;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.Role;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import com.example.eventmanagement.model.enums.EventStatus;
import org.bson.Document;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired private MongoTemplate mongoTemplate;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EventRepository eventRepository;

    @Override
    public void run(String... args) {
        createIndexes();
        seedDefaultUsers();
        seedDefaultEvents();
    }

    private void createIndexes() {
        mongoTemplate.indexOps(User.class)
                .ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());
        mongoTemplate.indexOps(Event.class)
                .ensureIndex(new Index().on("status", Sort.Direction.ASC));
        mongoTemplate.indexOps(Event.class)
                .ensureIndex(new Index().on("organizerId", Sort.Direction.ASC));
        mongoTemplate.indexOps(Registration.class)
                .ensureIndex(new Index().on("eventId", Sort.Direction.ASC));
        mongoTemplate.indexOps(Registration.class)
                .ensureIndex(new Index().on("userId", Sort.Direction.ASC));
        mongoTemplate.indexOps(Registration.class)
                .ensureIndex(new CompoundIndexDefinition(
                        new Document("eventId", 1).append("userId", 1)
                ).unique());
        System.out.println("✅ MongoDB indexes created successfully!");
    }

    private void seedDefaultUsers() {
        if (userRepository.count() == 0) {
            // Admin - không cần balance
            User admin = buildUser("Admin", "admin@event.com", "admin123", Role.ADMIN, 0L);
            // Organizer - không cần balance
            User organizer = buildUser("Organizer Demo", "organizer@event.com", "org123", Role.ORGANIZER, 0L);
            // 2 tài khoản ATTENDEE có sẵn 50 triệu để test mua vé
            User user1 = buildUser("Nguyễn Văn An", "user@event.com", "user123", Role.ATTENDEE, 50_000_000L);
            User user2 = buildUser("Trần Thị Bình", "user2@event.com", "user123", Role.ATTENDEE, 50_000_000L);

            userRepository.saveAll(List.of(admin, organizer, user1, user2));
            System.out.println("✅ Seed data created! (4 users, user & user2 có 50 triệu mỗi người)");
        }
    }

    private User buildUser(String name, String email, String rawPassword, Role role, long balance) {
        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setRole(role);
        u.setEnabled(true);
        u.setBalance(balance);
        u.setCreatedAt(LocalDateTime.now());
        u.setUpdatedAt(LocalDateTime.now());
        return u;
    }

    private void seedDefaultEvents() {
        if (eventRepository.count() == 0) {
            User organizer = userRepository.findByEmail("organizer@event.com").orElse(null);
            if (organizer == null) return;

            List<Event> events = new java.util.ArrayList<>();

            // 10 sự kiện MIỄN PHÍ
            for (int i = 1; i <= 10; i++) {
                Event e = buildBaseEvent(organizer, i);
                e.setFree(true);
                e.setMaxCapacity(100 + i * 10);
                events.add(e);
            }

            // 5 sự kiện CÓ PHÍ với zones
            String[][] paidEventData = {
                {"🎵 Đêm Nhạc Sống 2026", "TP. Hồ Chí Minh", "Music,Live"},
                {"🎭 Festival Nghệ Thuật Hà Nội", "Hà Nội", "Arts,Culture"},
                {"🏃 Marathon Thành Phố", "Đà Nẵng", "Sports,Running"},
                {"🎪 Hội Chợ Công Nghệ Expo", "TP. Hồ Chí Minh", "Technology,Expo"},
                {"🎨 Triển Lãm Mỹ Thuật Quốc Tế", "Hà Nội", "Arts,Exhibition"},
            };

            for (int i = 0; i < paidEventData.length; i++) {
                Event e = new Event();
                e.setTitle(paidEventData[i][0]);
                e.setDescription("Sự kiện đặc biệt với nhiều hoạt động hấp dẫn. Đặt vé ngay để có chỗ ngồi tốt nhất!");
                e.setLocation(paidEventData[i][1]);
                e.setStartDate(LocalDateTime.now().plusDays(7 + i * 5));
                e.setEndDate(LocalDateTime.now().plusDays(7 + i * 5).plusHours(5));
                e.setStatus(EventStatus.PUBLISHED);
                e.setTags(Arrays.asList(paidEventData[i][2].split(",")));
                e.setOrganizerId(organizer.getId());
                e.setOrganizerName(organizer.getFullName());
                e.setFree(false);
                e.setCurrentAttendees(0);
                e.setCreatedAt(LocalDateTime.now());
                e.setUpdatedAt(LocalDateTime.now());

                // Định nghĩa zones
                List<SeatZone> zones = Arrays.asList(
                    new SeatZone("zone-vip-" + i, "VIP", "Hàng đầu, gần sân khấu, có ghế êm ái", "#FFD700", 50, 500_000L),
                    new SeatZone("zone-std-" + i, "Standard", "Khu vực chính, tầm nhìn tốt", "#4FC3F7", 200, 200_000L),
                    new SeatZone("zone-eco-" + i, "Economy", "Khu vực phổ thông, giá hợp lý", "#81C784", 300, 80_000L)
                );
                e.setSeatZones(zones);
                events.add(e);
            }

            eventRepository.saveAll(events);
            System.out.println("✅ Seed data created! (10 free + 5 paid events)");
        }
    }

    private Event buildBaseEvent(User organizer, int i) {
        Event e = new Event();
        e.setTitle("Sự Kiện Miễn Phí Demo #" + i);
        e.setDescription("Sự kiện miễn phí dành cho cộng đồng. Đăng ký ngay để giữ chỗ! Số " + i);
        e.setLocation(i % 2 == 0 ? "TP. Hồ Chí Minh" : "Hà Nội");
        e.setStartDate(LocalDateTime.now().plusDays(i));
        e.setEndDate(LocalDateTime.now().plusDays(i).plusHours(3));
        e.setStatus(EventStatus.PUBLISHED);
        e.setTags(Arrays.asList("Community", i % 2 == 0 ? "Workshop" : "Seminar"));
        e.setOrganizerId(organizer.getId());
        e.setOrganizerName(organizer.getFullName());
        e.setCurrentAttendees(0);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        return e;
    }
}
