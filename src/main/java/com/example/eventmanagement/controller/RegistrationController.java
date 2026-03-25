package com.example.eventmanagement.controller;

import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.Registration;
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class RegistrationController {

    @Autowired private RegistrationService registrationService;
    @Autowired private EventService eventService;

    @PostMapping("/events/{id}/register")
    public String register(@PathVariable String id, Authentication auth,
                           RedirectAttributes redirectAttributes) {
        try {
            registrationService.register(id, auth.getName());
            redirectAttributes.addFlashAttribute("successMessage", "Đăng ký tham dự thành công! 🎉");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/events/" + id;
    }

    @PostMapping("/registrations/{id}/cancel")
    public String cancel(@PathVariable String id, Authentication auth,
                         RedirectAttributes redirectAttributes) {
        try {
            registrationService.cancel(id, auth.getName());
            redirectAttributes.addFlashAttribute("successMessage", "Đã hủy đăng ký thành công");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
        }
        return "redirect:/my-registrations";
    }

    @GetMapping("/my-registrations")
    public String myRegistrations(Authentication auth, Model model) {
        List<Registration> registrations = registrationService.getByUserEmail(auth.getName());

        // Fetch events for display
        Map<String, Event> eventMap = registrations.stream()
                .collect(Collectors.toMap(
                        Registration::getEventId,
                        r -> {
                            try { return eventService.getEventById(r.getEventId()); }
                            catch (Exception e) { return new Event(); }
                        },
                        (a, b) -> a
                ));

        model.addAttribute("registrations", registrations);
        model.addAttribute("eventMap", eventMap);
        return "registrations/my-registrations";
    }


    // Organizer: view registrations for their event
    @GetMapping("/organizer/events/{id}/registrations")
    public String eventRegistrations(@PathVariable String id, Model model, Authentication auth) {
        Event event = eventService.getEventById(id);
        List<Registration> registrations = registrationService.getByEventId(id);
        model.addAttribute("event", event);
        model.addAttribute("registrations", registrations);
        return "registrations/event-registrations";
    }
}
