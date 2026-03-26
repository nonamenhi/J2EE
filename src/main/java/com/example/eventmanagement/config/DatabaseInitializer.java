package com.example.eventmanagement.config;

import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.Role;
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
import java.util.List;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import org.bson.Document;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.example.eventmanagement.repository.EventRepository eventRepository;

    @Override
    public void run(String... args) {
        createIndexes();
        seedDefaultUsers();
        seedDefaultEvents();
    }

    private void createIndexes() {
        // User indexes
        mongoTemplate.indexOps(User.class)
                .ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());

        // Event indexes
        mongoTemplate.indexOps(Event.class)
                .ensureIndex(new Index().on("status", Sort.Direction.ASC));
        mongoTemplate.indexOps(Event.class)
                .ensureIndex(new Index().on("organizerId", Sort.Direction.ASC));

        // Registration indexes
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
            userRepository.saveAll(List.of(
                    buildUser("Admin", "admin@event.com", "admin123", Role.ADMIN),
                    buildUser("Organizer Demo", "organizer@event.com", "org123", Role.ORGANIZER),
                    buildUser("User Demo", "user@event.com", "user123", Role.ATTENDEE)
            ));
            System.out.println("✅ Seed data created successfully! (3 users)");
        }
    }

    private User buildUser(String name, String email, String rawPassword, Role role) {
        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setRole(role);
        u.setEnabled(true);
        u.setCreatedAt(LocalDateTime.now());
        u.setUpdatedAt(LocalDateTime.now());
        return u;
    }

    private void seedDefaultEvents() {
        if (eventRepository.count() == 0) {
            User organizer = userRepository.findByEmail("organizer@event.com").orElse(null);
            if (organizer == null) return;

            java.util.List<Event> events = new java.util.ArrayList<>();
            for (int i = 1; i <= 20; i++) {
                Event e = new Event();
                e.setTitle("Sự kiện Demo " + i);
                e.setDescription("Mô tả chi tiết cho sự kiện demo số " + i + ". Đây là dữ liệu được tạo tự động để bạn có thể test ứng dụng dễ dàng.");
                e.setLocation(i % 2 == 0 ? "TP. Hồ Chí Minh" : "Hà Nội");
                e.setStartDate(LocalDateTime.now().plusDays(i));
                e.setEndDate(LocalDateTime.now().plusDays(i).plusHours(4));
                e.setMaxCapacity(50 + (i * 10));
                e.setCurrentAttendees(0);
                e.setStatus(com.example.eventmanagement.model.enums.EventStatus.PUBLISHED);
                e.setTags(java.util.Arrays.asList("Technology", i % 2 == 0 ? "Workshop" : "Seminar"));
                e.setOrganizerId(organizer.getId());
                e.setOrganizerName(organizer.getFullName());
                e.setCreatedAt(LocalDateTime.now());
                e.setUpdatedAt(LocalDateTime.now());
                events.add(e);
            }
            eventRepository.saveAll(events);
            System.out.println("✅ Seed data created successfully! (20 events)");
        }
    }
}
