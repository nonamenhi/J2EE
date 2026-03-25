package com.example.eventmanagement.exception;

public class CapacityExceededException extends RuntimeException {
    public CapacityExceededException(String message) {
        super(message);
    }

    public CapacityExceededException() {
        super("Sự kiện đã đủ số người tham dự");
    }
}
