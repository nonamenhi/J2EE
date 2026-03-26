package com.example.eventmanagement.service.impl;

import com.example.eventmanagement.exception.CapacityExceededException;
import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RegistrationServiceImplTest {

    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private RegistrationServiceImpl registrationService;

    private Event sampleEvent;
    private User sampleUser;
    private Registration sampleRegistration;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("u1");
        sampleUser.setEmail("user@example.com");
        sampleUser.setFullName("User Name");

        sampleEvent = new Event();
        sampleEvent.setId("e1");
        sampleEvent.setStatus(EventStatus.PUBLISHED);
        sampleEvent.setMaxCapacity(50);
        sampleEvent.setCurrentAttendees(10);

        sampleRegistration = new Registration();
        sampleRegistration.setId("r1");
        sampleRegistration.setEventId("e1");
        sampleRegistration.setUserId("u1");
        sampleRegistration.setStatus("CONFIRMED");
    }

    @Test
    void register_Success() {
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(registrationRepository.existsByEventIdAndUserId("e1", "u1")).thenReturn(false);

        Registration result = registrationService.register("e1", "user@example.com");

        assertNotNull(result);
        assertEquals("e1", result.getEventId());
        assertEquals("CONFIRMED", result.getStatus());
        verify(registrationRepository, times(1)).save(any(Registration.class));
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), any(Update.class), eq(Event.class));
    }

    @Test
    void register_AlreadyRegistered() {
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(registrationRepository.existsByEventIdAndUserId("e1", "u1")).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> registrationService.register("e1", "user@example.com"));
    }

    @Test
    void register_CapacityExceeded() {
        sampleEvent.setCurrentAttendees(50); // Max capacity reached
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));
        when(registrationRepository.existsByEventIdAndUserId("e1", "u1")).thenReturn(false);

        assertThrows(CapacityExceededException.class, () -> registrationService.register("e1", "user@example.com"));
    }

    @Test
    void cancel_Success() {
        when(registrationRepository.findById("r1")).thenReturn(Optional.of(sampleRegistration));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(sampleUser));

        registrationService.cancel("r1", "user@example.com");

        assertEquals("CANCELLED", sampleRegistration.getStatus());
        verify(registrationRepository, times(1)).save(sampleRegistration);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), any(Update.class), eq(Event.class));
    }

    @Test
    void cancel_AccessDenied() {
        User otherUser = new User();
        otherUser.setId("u2");

        when(registrationRepository.findById("r1")).thenReturn(Optional.of(sampleRegistration));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));

        assertThrows(AccessDeniedException.class, () -> registrationService.cancel("r1", "other@example.com"));
    }
}
