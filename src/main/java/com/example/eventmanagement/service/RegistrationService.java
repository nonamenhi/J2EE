package com.example.eventmanagement.service;

import com.example.eventmanagement.model.Registration;

import java.util.List;

public interface RegistrationService {
    Registration register(String eventId, String userEmail);
    void cancel(String registrationId, String userEmail);
    List<Registration> getByUserEmail(String userEmail);
    List<Registration> getByEventId(String eventId);
    boolean isRegistered(String eventId, String userEmail);
}
