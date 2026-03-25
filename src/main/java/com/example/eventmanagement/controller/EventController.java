package com.example.eventmanagement.controller;

import com.example.eventmanagement.dto.EventDto;
import com.example.eventmanagement.model.Event;
import com.example.eventmanagement.model.enums.EventStatus;
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Arrays;
import java.util.List;

@Controller
public class EventController {

    @Autowired private EventService eventService;
    @Autowired private RegistrationService registrationService;

    // ===== PUBLIC =====

    @GetMapping({"/", "/events"})
    public String listEvents(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "") String tag,
            @RequestParam(defaultValue = "0") int page,
            Model model) {

        PageRequest pageable = PageRequest.of(page, 9, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Event> events = eventService.getPublishedEvents(keyword, tag, pageable);
        List<String> allTags = eventService.getAllTags();

        model.addAttribute("events", events);
        model.addAttribute("allTags", allTags);
        model.addAttribute("keyword", keyword);
        model.addAttribute("selectedTag", tag);
        model.addAttribute("currentPage", page);
        return "events/list";
    }

    @GetMapping("/events/{id}")
    public String eventDetail(@PathVariable String id, Model model, Authentication auth) {
        Event event = eventService.getEventById(id);
        model.addAttribute("event", event);

        int spotsLeft = event.getMaxCapacity() == 0
                ? Integer.MAX_VALUE
                : event.getMaxCapacity() - event.getCurrentAttendees();
        model.addAttribute("spotsLeft", spotsLeft);

        if (auth != null) {
            boolean alreadyRegistered = registrationService.isRegistered(id, auth.getName());
            model.addAttribute("alreadyRegistered", alreadyRegistered);
        } else {
            model.addAttribute("alreadyRegistered", false);
        }

        return "events/detail";
    }

    // ===== ORGANIZER =====

    @GetMapping("/events/create")
    public String createForm(Model model) {
        model.addAttribute("eventDto", new EventDto());
        model.addAttribute("statuses", EventStatus.values());
        return "events/form";
    }

    @PostMapping("/events/create")
    public String createEvent(@Valid @ModelAttribute("eventDto") EventDto dto,
                              BindingResult result,
                              @RequestParam(value = "bannerFile", required = false) MultipartFile bannerFile,
                              @RequestParam(value = "tagsInput", required = false) String tagsInput,
                              Authentication auth,
                              RedirectAttributes redirectAttributes,
                              Model model) {

        // Parse tags from comma-separated string
        if (tagsInput != null && !tagsInput.isBlank()) {
            List<String> tags = Arrays.stream(tagsInput.split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
            dto.setTags(tags);
        }

        if (result.hasErrors()) {
            model.addAttribute("statuses", EventStatus.values());
            return "events/form";
        }

        if (dto.getEndDate() != null && dto.getStartDate() != null
                && !dto.getEndDate().isAfter(dto.getStartDate())) {
            result.rejectValue("endDate", "error.eventDto", "Ngày kết thúc phải sau ngày bắt đầu");
            model.addAttribute("statuses", EventStatus.values());
            return "events/form";
        }

        try {
            eventService.createEvent(dto, auth.getName(), bannerFile);
            redirectAttributes.addFlashAttribute("successMessage", "Tạo sự kiện thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
        }
        return "redirect:/organizer/my-events";
    }

    @GetMapping("/events/{id}/edit")
    public String editForm(@PathVariable String id, Model model, Authentication auth) {
        Event event = eventService.getEventById(id);
        EventDto dto = new EventDto();
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setLocation(event.getLocation());
        dto.setStartDate(event.getStartDate());
        dto.setEndDate(event.getEndDate());
        dto.setMaxCapacity(event.getMaxCapacity());
        dto.setTags(event.getTags());
        dto.setStatus(event.getStatus().name());
        dto.setBannerImagePath(event.getBannerImagePath());

        model.addAttribute("eventDto", dto);
        model.addAttribute("event", event);
        model.addAttribute("statuses", EventStatus.values());
        return "events/form";
    }

    @PostMapping("/events/{id}/edit")
    public String updateEvent(@PathVariable String id,
                              @Valid @ModelAttribute("eventDto") EventDto dto,
                              BindingResult result,
                              @RequestParam(value = "bannerFile", required = false) MultipartFile bannerFile,
                              @RequestParam(value = "tagsInput", required = false) String tagsInput,
                              Authentication auth,
                              RedirectAttributes redirectAttributes,
                              Model model) {

        if (tagsInput != null && !tagsInput.isBlank()) {
            List<String> tags = Arrays.stream(tagsInput.split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList();
            dto.setTags(tags);
        }

        if (result.hasErrors()) {
            model.addAttribute("event", eventService.getEventById(id));
            model.addAttribute("statuses", EventStatus.values());
            return "events/form";
        }

        if (dto.getEndDate() != null && dto.getStartDate() != null
                && !dto.getEndDate().isAfter(dto.getStartDate())) {
            result.rejectValue("endDate", "error.eventDto", "Ngày kết thúc phải sau ngày bắt đầu");
            model.addAttribute("event", eventService.getEventById(id));
            model.addAttribute("statuses", EventStatus.values());
            return "events/form";
        }

        try {
            eventService.updateEvent(id, dto, auth.getName(), bannerFile);
            redirectAttributes.addFlashAttribute("successMessage", "Cập nhật sự kiện thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
        }
        return "redirect:/organizer/my-events";
    }

    @PostMapping("/events/{id}/delete")
    public String deleteEvent(@PathVariable String id, Authentication auth,
                              RedirectAttributes redirectAttributes) {
        try {
            eventService.cancelOrDeleteEvent(id, auth.getName());
            redirectAttributes.addFlashAttribute("successMessage", "Đã hủy/xóa sự kiện thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
        }
        return "redirect:/organizer/my-events";
    }

    // ===== ORGANIZER Dashboard =====

    @GetMapping("/organizer/my-events")
    public String myEvents(@RequestParam(defaultValue = "") String status,
                           @RequestParam(defaultValue = "0") int page,
                           Authentication auth, Model model) {

        EventStatus eventStatus = null;
        if (!status.isEmpty()) {
            try { eventStatus = EventStatus.valueOf(status); } catch (Exception ignored) {}
        }

        PageRequest pageable = PageRequest.of(page, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Event> events = eventService.getOrganizerEvents(auth.getName(), eventStatus, pageable);

        model.addAttribute("events", events);
        model.addAttribute("selectedStatus", status);
        model.addAttribute("statuses", EventStatus.values());
        model.addAttribute("currentPage", page);
        return "events/my-events";
    }
}
