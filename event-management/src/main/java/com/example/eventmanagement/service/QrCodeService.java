package com.example.eventmanagement.service;

public interface QrCodeService {
    /**
     * Generate a QR code PNG as a Base64 data URI.
     * @return "data:image/png;base64,..." ready to use in <img src="...">
     */
    String generateQrBase64(String registrationId, String eventId, String userId);
}
