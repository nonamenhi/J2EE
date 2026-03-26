package com.example.eventmanagement.service.impl;

import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.Role;
import com.example.eventmanagement.repository.UserRepository;
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

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("1");
        sampleUser.setEmail("test@example.com");
        sampleUser.setRole(Role.ATTENDEE);
        sampleUser.setEnabled(true);
    }

    @Test
    void findByEmail_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(sampleUser));

        User result = userService.findByEmail("test@example.com");

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void findByEmail_NotFound() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.findByEmail("notfound@example.com"));
    }

    @Test
    void save_Success() {
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);
        User result = userService.save(sampleUser);
        assertNotNull(result);
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    void getAllUsers_NoFilters() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(Collections.singletonList(sampleUser));
        when(userRepository.findAll(pageable)).thenReturn(page);

        Page<User> result = userService.getAllUsers(null, null, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void toggleEnabled_Success() {
        when(userRepository.findById("1")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);

        userService.toggleEnabled("1");

        assertFalse(sampleUser.isEnabled());
        verify(userRepository, times(1)).save(sampleUser);
    }
}
