package com.example.eventmanagement.service.impl;

import com.example.eventmanagement.exception.CapacityExceededException;
import com.example.eventmanagement.exception.EventNotFoundException;
import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.repository.UserRepository;
import com.example.eventmanagement.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistrationServiceImpl implements RegistrationService {

    @Autowired private RegistrationRepository registrationRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private MongoTemplate mongoTemplate;

    @Override
    public Registration register(String eventId, String userEmail) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException(eventId, true));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new IllegalStateException("Sự kiện không còn nhận đăng ký");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check already registered
        if (registrationRepository.existsByEventIdAndUserId(eventId, user.getId())) {
            throw new IllegalStateException("Bạn đã đăng ký sự kiện này rồi");
        }

        // Check capacity
        if (event.getMaxCapacity() > 0 && event.getCurrentAttendees() >= event.getMaxCapacity()) {
            throw new CapacityExceededException();
        }

        // Create registration
        Registration reg = new Registration();
        reg.setEventId(eventId);
        reg.setUserId(user.getId());
        reg.setUserFullName(user.getFullName());
        reg.setUserEmail(user.getEmail());
        reg.setRegisteredAt(LocalDateTime.now());
        reg.setStatus("CONFIRMED");
        registrationRepository.save(reg);

        // Atomic increment using MongoTemplate $inc
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("id").is(eventId)),
                new Update().inc("currentAttendees", 1),
                Event.class
        );

        return reg;
    }

    @Override
    public void cancel(String registrationId, String userEmail) {
        Registration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đăng ký"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!reg.getUserId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Không có quyền hủy đăng ký này");
        }

        reg.setStatus("CANCELLED");
        registrationRepository.save(reg);

        // Atomic decrement
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("id").is(reg.getEventId())),
                new Update().inc("currentAttendees", -1),
                Event.class
        );
    }

    @Override
    public List<Registration> getByUserEmail(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return registrationRepository.findByUserId(user.getId());
    }

    @Override
    public List<Registration> getByEventId(String eventId) {
        return registrationRepository.findByEventId(eventId);
    }

    @Override
    public boolean isRegistered(String eventId, String userEmail) {
        return userRepository.findByEmail(userEmail)
                .map(user -> registrationRepository.existsByEventIdAndUserId(eventId, user.getId()))
                .orElse(false);
    }
}
