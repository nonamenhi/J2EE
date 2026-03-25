package com.example.eventmanagement.controller;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.repository.EventRepository;
import com.example.eventmanagement.repository.RegistrationRepository;
import com.example.eventmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Controller
public class DashboardController {

    @Autowired private EventRepository eventRepository;
    @Autowired private RegistrationRepository registrationRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/admin/dashboard")
    public String adminDashboard(Model model) {
        long totalEvents = eventRepository.count();
        long publishedEvents = eventRepository.findByStatus(EventStatus.PUBLISHED, PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
        long totalUsers = userRepository.count();
        long totalRegistrations = registrationRepository.count();

        List<Event> top5Events = eventRepository.findTop5ByOrderByCurrentAttendeesDesc();
        List<Event> recentEvents = eventRepository.findAll().stream()
                .sorted(Comparator.comparing(Event::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .collect(Collectors.toList());

        // Events by month (last 12 months)
        Map<String, Long> eventsByMonth = eventRepository.findAll().stream()
                .filter(e -> e.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getCreatedAt().getYear() + "-" + String.format("%02d", e.getCreatedAt().getMonthValue()),
                        Collectors.counting()
                ));

        // Build last 12 months labels and data
        List<String> monthLabels = new ArrayList<>();
        List<Long> monthData = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = 11; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            String key = month.getYear() + "-" + String.format("%02d", month.getMonthValue());
            monthLabels.add(month.getMonthValue() + "/" + month.getYear());
            monthData.add(eventsByMonth.getOrDefault(key, 0L));
        }

        model.addAttribute("totalEvents", totalEvents);
        model.addAttribute("publishedEvents", publishedEvents);
        model.addAttribute("totalUsers", totalUsers);
        model.addAttribute("totalRegistrations", totalRegistrations);
        model.addAttribute("top5Events", top5Events);
        model.addAttribute("recentEvents", recentEvents);
        model.addAttribute("monthLabels", monthLabels);
        model.addAttribute("monthData", monthData);

        return "admin/dashboard";
    }

    @GetMapping("/admin/reports")
    public String reports(Model model) {
        List<Event> events = eventRepository.findAll();
        model.addAttribute("events", events);
        return "admin/reports";
    }

    @GetMapping("/organizer/dashboard")
    public String organizerDashboard(Model model,
                                     org.springframework.security.core.Authentication auth) {
        return "redirect:/organizer/my-events";
    }
}
