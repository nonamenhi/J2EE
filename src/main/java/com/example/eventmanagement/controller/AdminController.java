package com.example.eventmanagement.controller;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.model.User;
import com.example.eventmanagement.model.enums.Role;
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.RegistrationService;
import com.example.eventmanagement.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired private UserService userService;
    @Autowired private EventService eventService;
    @Autowired private RegistrationService registrationService;

    @GetMapping("/users")
    public String manageUsers(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "0") int page,
            Model model) {

        Role roleFilter = null;
        if (!role.isEmpty()) {
            try { roleFilter = Role.valueOf(role); } catch (Exception ignored) {}
        }

        PageRequest pageable = PageRequest.of(page, 10, Sort.by("createdAt").descending());
        Page<User> users = userService.getAllUsers(keyword, roleFilter, pageable);

        model.addAttribute("users", users);
        model.addAttribute("keyword", keyword);
        model.addAttribute("selectedRole", role);
        model.addAttribute("roles", Role.values());
        model.addAttribute("currentPage", page);
        return "admin/users";
    }

    @PostMapping("/users/{id}/toggle")
    public String toggleUser(@PathVariable String id, RedirectAttributes redirectAttributes) {
        try {
            userService.toggleEnabled(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã cập nhật trạng thái tài khoản");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/admin/users";
    }

    @PostMapping("/users/{id}/role")
    public String changeRole(@PathVariable String id, @RequestParam String role,
                             RedirectAttributes redirectAttributes) {
        try {
            userService.changeRole(id, Role.valueOf(role));
            redirectAttributes.addFlashAttribute("successMessage", "Đã đổi quyền thành công");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/admin/users";
    }

    // Xem danh sách đăng ký của sự kiện (dành cho ADMIN)
    @GetMapping("/events/{id}/registrations")
    public String viewEventRegistrations(@PathVariable String id, Model model) {
        Event event = eventService.getEventById(id);
        List<Registration> registrations = registrationService.getByEventId(id);
        model.addAttribute("event", event);
        model.addAttribute("registrations", registrations);
        return "registrations/event-registrations";
    }
}


