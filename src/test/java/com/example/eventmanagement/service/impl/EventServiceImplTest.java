package com.example.eventmanagement.service.impl;

import com.example.eventmanagement.dto.EventDto;
import com.example.eventmanagement.exception.EventNotFoundException;
import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.model.enums.Role;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.repository.UserRepository;
import com.example.eventmanagement.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private EventServiceImpl eventService;

    private Event sampleEvent;
    private User sampleUser;
    private EventDto sampleDto;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("u1");
        sampleUser.setEmail("organizer@example.com");
        sampleUser.setRole(Role.ORGANIZER);
        sampleUser.setFullName("Organizer Name");

        sampleEvent = new Event();
        sampleEvent.setId("e1");
        sampleEvent.setTitle("Test Event");
        sampleEvent.setOrganizerId("u1");
        sampleEvent.setStatus(EventStatus.PUBLISHED);
        sampleEvent.setCurrentAttendees(0);

        sampleDto = new EventDto();
        sampleDto.setTitle("Updated Event");
        sampleDto.setDescription("Desc");
        sampleDto.setLocation("Loc");
        sampleDto.setStartDate(LocalDateTime.now().plusDays(1));
        sampleDto.setEndDate(LocalDateTime.now().plusDays(2));
        sampleDto.setMaxCapacity(100);
        sampleDto.setStatus("PUBLISHED");
    }

    @Test
    void getEventById_Success() {
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        Event result = eventService.getEventById("e1");
        assertNotNull(result);
        assertEquals("Test Event", result.getTitle());
    }

    @Test
    void getEventById_NotFound() {
        when(eventRepository.findById("e2")).thenReturn(Optional.empty());
        assertThrows(EventNotFoundException.class, () -> eventService.getEventById("e2"));
    }

    @Test
    void createEvent_Success() {
        when(userRepository.findByEmail("organizer@example.com")).thenReturn(Optional.of(sampleUser));
        when(eventRepository.save(any(Event.class))).thenAnswer(i -> i.getArguments()[0]);

        Event result = eventService.createEvent(sampleDto, "organizer@example.com", null);

        assertNotNull(result);
        assertEquals("Updated Event", result.getTitle());
        assertEquals("u1", result.getOrganizerId());
        assertEquals(EventStatus.PUBLISHED, result.getStatus());
        verify(eventRepository, times(1)).save(any(Event.class));
    }

    @Test
    void updateEvent_Success() {
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("organizer@example.com")).thenReturn(Optional.of(sampleUser));
        when(eventRepository.save(any(Event.class))).thenAnswer(i -> i.getArguments()[0]);

        Event result = eventService.updateEvent("e1", sampleDto, "organizer@example.com", null);

        assertNotNull(result);
        assertEquals("Updated Event", result.getTitle());
        verify(eventRepository, times(1)).save(sampleEvent);
    }

    @Test
    void updateEvent_AccessDenied() {
        User anotherUser = new User();
        anotherUser.setId("u2");
        anotherUser.setEmail("other@example.com");
        anotherUser.setRole(Role.ATTENDEE);

        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(anotherUser));

        assertThrows(AccessDeniedException.class, () -> 
            eventService.updateEvent("e1", sampleDto, "other@example.com", null));
    }

    @Test
    void cancelOrDeleteEvent_Delete_Success() {
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("organizer@example.com")).thenReturn(Optional.of(sampleUser));
        when(registrationRepository.countByEventId("e1")).thenReturn(0L);

        eventService.cancelOrDeleteEvent("e1", "organizer@example.com");

        verify(eventRepository, times(1)).deleteById("e1");
    }

    @Test
    void cancelOrDeleteEvent_Cancel_Success() {
        when(eventRepository.findById("e1")).thenReturn(Optional.of(sampleEvent));
        when(userRepository.findByEmail("organizer@example.com")).thenReturn(Optional.of(sampleUser));
        when(registrationRepository.countByEventId("e1")).thenReturn(5L);

        eventService.cancelOrDeleteEvent("e1", "organizer@example.com");

        assertEquals(EventStatus.CANCELLED, sampleEvent.getStatus());
        verify(eventRepository, times(1)).save(sampleEvent);
    }
}
