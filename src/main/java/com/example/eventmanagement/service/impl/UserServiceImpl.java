package com.example.eventmanagement.service.impl;

import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.Role;
import com.example.eventmanagement.repository.UserRepository;
import com.example.eventmanagement.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public Page<User> getAllUsers(String keyword, Role role, Pageable pageable) {
        boolean hasKeyword = StringUtils.hasText(keyword);
        boolean hasRole = role != null;

        if (hasKeyword && hasRole) {
            return userRepository.findByKeywordAndRole(keyword, role, pageable);
        } else if (hasKeyword) {
            return userRepository.findByKeyword(keyword, pageable);
        } else if (hasRole) {
            return userRepository.findByRole(role, pageable);
        } else {
            return userRepository.findAll(pageable);
        }
    }

    @Override
    public User getById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    @Override
    public void toggleEnabled(String id) {
        User user = getById(id);
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }

    @Override
    public void changeRole(String id, Role role) {
        User user = getById(id);
        user.setRole(role);
        userRepository.save(user);
    }
}
