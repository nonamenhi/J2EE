package com.example.eventmanagement.service.impl;

import com.example.eventmanagement.service.QrCodeService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageConfig;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;
import javax.imageio.ImageIO;

@Service
public class QrCodeServiceImpl implements QrCodeService {

    private static final int QR_SIZE = 300;

    @Override
    public String generateQrBase64(String registrationId, String eventId, String userId) {
        try {
            // JSON payload chứa thông tin vé
            String payload = String.format(
                "{\"rid\":\"%s\",\"eid\":\"%s\",\"uid\":\"%s\"}",
                registrationId, eventId, userId
            );

            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.MARGIN, 2);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bitMatrix = writer.encode(payload, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);

            // Dark = màu tím (#6c63ff), Light = trắng
            MatrixToImageConfig config = new MatrixToImageConfig(0xFF6c63ff, 0xFFFFFFFF);
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix, config);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", baos);
            byte[] pngBytes = baos.toByteArray();

            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngBytes);

        } catch (WriterException | java.io.IOException e) {
            throw new RuntimeException("Không thể tạo QR code: " + e.getMessage(), e);
        }
    }
}
