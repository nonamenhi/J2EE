package com.example.eventmanagement.service;

import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    User findByEmail(String email);
    User save(User user);
    Page<User> getAllUsers(String keyword, Role role, Pageable pageable);
    User getById(String id);
    void toggleEnabled(String id);
    void changeRole(String id, Role role);
}
