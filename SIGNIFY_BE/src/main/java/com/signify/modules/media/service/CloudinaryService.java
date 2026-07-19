package com.signify.modules.media.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Upload ảnh (avatar) lên Cloudinary bằng signed upload.
 * Không dùng SDK: tự ký chữ ký SHA-1 và gửi multipart qua HttpClient chuẩn JDK.
 */
@Service
@Slf4j
public class CloudinaryService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${cloudinary.avatar-folder:signify/avatars}")
    private String avatarFolder;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isConfigured() {
        return notBlank(cloudName) && notBlank(apiKey) && notBlank(apiSecret);
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank() && !s.startsWith("${");
    }

    /**
     * Upload avatar, trả về secure_url. Ném RuntimeException nếu chưa cấu hình hoặc lỗi.
     */
    public String uploadAvatar(MultipartFile file, String userId) {
        if (!isConfigured()) {
            throw new RuntimeException("Cloudinary chưa được cấu hình (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).");
        }
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File rỗng.");
        }

        // Validate file size (max 5MB)
        long maxSize = 5 * 1024 * 1024;
        if (file.getSize() > maxSize) {
            throw new RuntimeException("Kích thước ảnh không được vượt quá 5MB.");
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !List.of("image/jpeg", "image/png", "image/gif", "image/webp").contains(contentType.toLowerCase())) {
            throw new RuntimeException("File phải là ảnh JPG, PNG, GIF hoặc WebP.");
        }

        // Validate file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            if (!List.of("jpg", "jpeg", "png", "gif", "webp").contains(ext)) {
                throw new RuntimeException("Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, PNG, GIF, WebP.");
            }
        }
        try {
            long timestamp = System.currentTimeMillis() / 1000L;
            String publicId = "user_" + userId;

            // Các tham số cần ký (theo thứ tự alphabet), KHÔNG gồm file/api_key.
            String toSign = "folder=" + avatarFolder
                    + "&overwrite=true"
                    + "&public_id=" + publicId
                    + "&timestamp=" + timestamp;
            String signature = sha1Hex(toSign + apiSecret);

            List<FormPart> parts = new ArrayList<>();
            parts.add(FormPart.field("api_key", apiKey));
            parts.add(FormPart.field("timestamp", String.valueOf(timestamp)));
            parts.add(FormPart.field("public_id", publicId));
            parts.add(FormPart.field("folder", avatarFolder));
            parts.add(FormPart.field("overwrite", "true"));
            parts.add(FormPart.field("signature", signature));
            parts.add(FormPart.file("file", file.getOriginalFilename(),
                    file.getContentType(), file.getBytes()));

            String boundary = "----SignifyBoundary" + System.nanoTime();
            byte[] body = buildMultipartBody(parts, boundary);

            String url = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Cloudinary upload lỗi {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Upload ảnh thất bại (HTTP " + response.statusCode() + ").");
            }
            JsonNode root = objectMapper.readTree(response.body());
            String secureUrl = root.path("secure_url").asText(null);
            if (secureUrl == null || secureUrl.isEmpty()) {
                throw new RuntimeException("Cloudinary không trả về secure_url.");
            }
            return secureUrl;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Upload avatar thất bại", e);
            throw new RuntimeException("Upload ảnh thất bại: " + e.getMessage());
        }
    }

    private String sha1Hex(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private byte[] buildMultipartBody(List<FormPart> parts, String boundary) throws Exception {
        var out = new java.io.ByteArrayOutputStream();
        String dashBoundary = "--" + boundary + "\r\n";
        for (FormPart p : parts) {
            out.write(dashBoundary.getBytes(StandardCharsets.UTF_8));
            if (p.filename == null) {
                out.write(("Content-Disposition: form-data; name=\"" + p.name + "\"\r\n\r\n")
                        .getBytes(StandardCharsets.UTF_8));
                out.write(p.value.getBytes(StandardCharsets.UTF_8));
                out.write("\r\n".getBytes(StandardCharsets.UTF_8));
            } else {
                out.write(("Content-Disposition: form-data; name=\"" + p.name
                        + "\"; filename=\"" + p.filename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
                out.write(("Content-Type: " + (p.contentType != null ? p.contentType : "application/octet-stream")
                        + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
                out.write(p.content);
                out.write("\r\n".getBytes(StandardCharsets.UTF_8));
            }
        }
        out.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }

    /** Một phần trong body multipart: field text hoặc file nhị phân. */
    private static class FormPart {
        String name;
        String value;
        String filename;
        String contentType;
        byte[] content;

        static FormPart field(String name, String value) {
            FormPart p = new FormPart();
            p.name = name;
            p.value = value;
            return p;
        }

        static FormPart file(String name, String filename, String contentType, byte[] content) {
            FormPart p = new FormPart();
            p.name = name;
            p.filename = filename != null ? filename : "upload";
            p.contentType = contentType;
            p.content = content;
            return p;
        }
    }
}
