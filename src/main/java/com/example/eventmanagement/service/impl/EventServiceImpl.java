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
import com.example.eventmanagement.service.EventService;
import com.example.eventmanagement.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EventServiceImpl implements EventService {

    @Autowired private EventRepository eventRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RegistrationRepository registrationRepository;
    @Autowired private FileStorageService fileStorageService;

    @Autowired private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @Override
    public Page<Event> getPublishedEvents(String keyword, String tag, String location,
                                          java.time.LocalDate dateFrom, java.time.LocalDate dateTo,
                                          Pageable pageable) {
        org.springframework.data.mongodb.core.query.Criteria criteria =
                org.springframework.data.mongodb.core.query.Criteria.where("status").is(EventStatus.PUBLISHED);

        if (StringUtils.hasText(keyword)) {
            criteria.and("title").regex(keyword, "i");
        }
        if (StringUtils.hasText(tag)) {
            criteria.and("tags").is(tag);
        }
        if (StringUtils.hasText(location)) {
            criteria.and("location").regex(location, "i");
        }
        if (dateFrom != null) {
            criteria.and("startDate").gte(dateFrom.atStartOfDay());
        }
        if (dateTo != null) {
            if (dateFrom != null) {
                // startDate đã được khai báo, dùng lte trên cùng field
                criteria.and("endDate").lte(dateTo.plusDays(1).atStartOfDay());
            } else {
                criteria.and("startDate").lte(dateTo.plusDays(1).atStartOfDay());
            }
        }

        org.springframework.data.mongodb.core.query.Query query =
                new org.springframework.data.mongodb.core.query.Query(criteria).with(pageable);
        long total = mongoTemplate.count(
                new org.springframework.data.mongodb.core.query.Query(criteria), Event.class);
        java.util.List<Event> results = mongoTemplate.find(query, Event.class);
        return new org.springframework.data.domain.PageImpl<>(results, pageable, total);
    }

    @Override
    public Event getEventById(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new EventNotFoundException(id, true));
    }

    @Override
    public Event createEvent(EventDto dto, String organizerEmail, MultipartFile bannerFile) {
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Event event = new Event();
        mapDtoToEvent(dto, event);
        event.setOrganizerId(organizer.getId());
        event.setOrganizerName(organizer.getFullName());
        event.setCurrentAttendees(0);
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());

        if (bannerFile != null && !bannerFile.isEmpty()) {
            String filename = fileStorageService.storeFile(bannerFile);
            event.setBannerImagePath(filename);
        }

        return eventRepository.save(event);
    }

    @Override
    public Event updateEvent(String id, EventDto dto, String currentUserEmail, MultipartFile bannerFile) {
        Event event = getEventById(id);
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ADMIN can edit any, ORGANIZER only own
        if (currentUser.getRole() != Role.ADMIN &&
                !event.getOrganizerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Bạn không có quyền sửa sự kiện này");
        }

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Không thể sửa sự kiện đã bị hủy");
        }

        // Validate capacity
        if (dto.getMaxCapacity() > 0 && dto.getMaxCapacity() < event.getCurrentAttendees()) {
            throw new IllegalArgumentException(
                    "Số chỗ không được nhỏ hơn số người đã đăng ký (" + event.getCurrentAttendees() + ")");
        }

        mapDtoToEvent(dto, event);
        event.setUpdatedAt(LocalDateTime.now());

        if (bannerFile != null && !bannerFile.isEmpty()) {
            // Delete old banner
            fileStorageService.deleteFile(event.getBannerImagePath());
            String filename = fileStorageService.storeFile(bannerFile);
            event.setBannerImagePath(filename);
        }

        return eventRepository.save(event);
    }

    @Override
    public void cancelOrDeleteEvent(String id, String currentUserEmail) {
        Event event = getEventById(id);
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (currentUser.getRole() != Role.ADMIN &&
                !event.getOrganizerId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa sự kiện này");
        }

        long registrationCount = registrationRepository.countByEventId(id);
        if (registrationCount > 0) {
            event.setStatus(EventStatus.CANCELLED);
            event.setUpdatedAt(LocalDateTime.now());
            eventRepository.save(event);
        } else {
            fileStorageService.deleteFile(event.getBannerImagePath());
            eventRepository.deleteById(id);
        }
    }

    @Override
    public Page<Event> getOrganizerEvents(String organizerEmail, EventStatus status, Pageable pageable) {
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (status != null) {
            return eventRepository.findByOrganizerIdAndStatus(organizer.getId(), status, pageable);
        }
        return eventRepository.findByOrganizerId(organizer.getId(), pageable);
    }

    @Override
    public List<String> getAllTags() {
        return eventRepository.findAll().stream()
                .filter(e -> e.getTags() != null)
                .flatMap(e -> e.getTags().stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getAllLocations() {
        // Trích xuất tên tỉnh/thành phố từ trường location (lấy phần sau dấu phẩy cuối)
        return eventRepository.findAll().stream()
                .filter(e -> e.getLocation() != null && !e.getLocation().isBlank())
                .map(e -> {
                    String loc = e.getLocation();
                    int commaIdx = loc.lastIndexOf(",");
                    return commaIdx >= 0 ? loc.substring(commaIdx + 1).trim() : loc.trim();
                })
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private void mapDtoToEvent(EventDto dto, Event event) {
        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setLocation(dto.getLocation());
        event.setStartDate(dto.getStartDate());
        event.setEndDate(dto.getEndDate());
        event.setMaxCapacity(dto.getMaxCapacity());
        event.setTags(dto.getTags() != null ? dto.getTags() : new ArrayList<>());
        if (dto.getStatus() != null) {
            event.setStatus(EventStatus.valueOf(dto.getStatus()));
        } else {
            event.setStatus(EventStatus.DRAFT);
        }
    }
}
