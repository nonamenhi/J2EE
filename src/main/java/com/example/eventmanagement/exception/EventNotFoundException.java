package com.example.eventmanagement.exception;

public class EventNotFoundException extends RuntimeException {
    public EventNotFoundException(String message) {
        super(message);
    }

    public EventNotFoundException(String id, boolean isId) {
        super("Không tìm thấy sự kiện" + (isId ? " với ID: " + id : ": " + id));
    }
}
