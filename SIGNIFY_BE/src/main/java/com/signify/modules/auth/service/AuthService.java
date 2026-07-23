package com.signify.modules.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.signify.modules.auth.dto.AuthResponse;
import com.signify.modules.auth.dto.GoogleLoginRequest;
import com.signify.modules.auth.dto.LoginRequest;
import com.signify.modules.auth.dto.RegisterRequest;
import com.signify.modules.auth.util.JwtUtil;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Collections;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int PASSWORD_RESET_TOKEN_BYTES = 32;
    private static final int PASSWORD_RESET_TOKEN_VALID_MINUTES = 30;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${google.client-id}")
    private String googleClientId;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    public void registerUser(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User already exists");
        }

        String verificationToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        
        User user = User.builder()
                .fullName(request.getFullName())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .verificationToken(verificationToken)
                .isVerified(false)
                .role("USER")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        String verificationUrl = frontendUrl + "/verify-email/" + verificationToken;
        String emailContent = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;\">" +
                "<h2 style=\"color: #4F46E5;\">Welcome to Signify!</h2>" +
                "<p>Please verify your email address to get started with our video accessibility suite.</p>" +
                "<a href=\"" + verificationUrl + "\" style=\"display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;\">Verify Email Address</a>" +
                "<p style=\"margin-top: 20px; color: #666; font-size: 14px;\">If the button doesn't work, copy and paste this link into your browser: <br/> " + verificationUrl + "</p>" +
                "</div>";

        emailService.sendHtmlEmail(user.getEmail(), "Verify your Signify account", emailContent);
    }

    public AuthResponse loginUser(LoginRequest request) {
        String identifier = request.resolveIdentifier();
        if (identifier == null || identifier.isBlank()) {
            throw new RuntimeException("Email or login ID is required");
        }
        String normalized = identifier.trim();
        User user = (normalized.contains("@")
                ? userRepository.findByEmailIgnoreCase(normalized)
                : userRepository.findByUsernameIgnoreCase(normalized))
                .orElseThrow(() -> new RuntimeException("Invalid login ID or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid login ID or password");
        }

        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("This account is inactive");
        }

        if (user.getIsVerified() != null && !user.getIsVerified()) {
            throw new RuntimeException("Please verify your email to login");
        }

        String token = jwtUtil.generateToken(user.getId());

        return AuthResponse.builder()
                ._id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .token(token)
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .build();
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired verification token"));

        user.setIsVerified(true);
        user.setStatus("ACTIVE");
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    public boolean requestPasswordReset(String requestedEmail) {
        String email = requestedEmail.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            return false;
        }

        String rawToken = generatePasswordResetToken();
        user.setPasswordResetTokenHash(hashPasswordResetToken(rawToken));
        user.setPasswordResetTokenExpiresAt(
                LocalDateTime.now().plusMinutes(PASSWORD_RESET_TOKEN_VALID_MINUTES));
        userRepository.save(user);

        String resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + rawToken;
        String emailContent = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;\">" +
                "<h2 style=\"color: #2563EB;\">Đặt lại mật khẩu Signify</h2>" +
                "<p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>" +
                "<a href=\"" + resetUrl + "\" style=\"display: inline-block; padding: 12px 24px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;\">Đặt lại mật khẩu</a>" +
                "<p style=\"margin-top: 20px; color: #666; font-size: 14px;\">Liên kết có hiệu lực trong 30 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>" +
                "<p style=\"color: #666; font-size: 14px;\">Nếu nút không hoạt động, hãy sao chép liên kết sau:<br/>" + resetUrl + "</p>" +
                "</div>";

        try {
            emailService.sendHtmlEmail(user.getEmail(), "Đặt lại mật khẩu Signify", emailContent);
        } catch (RuntimeException exception) {
            user.setPasswordResetTokenHash(null);
            user.setPasswordResetTokenExpiresAt(null);
            userRepository.save(user);
            throw exception;
        }
        return true;
    }

    public boolean resetPassword(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            return false;
        }

        User user = userRepository.findByPasswordResetTokenHash(hashPasswordResetToken(rawToken.trim()))
                .orElse(null);
        if (user == null) {
            return false;
        }

        LocalDateTime expiresAt = user.getPasswordResetTokenExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            user.setPasswordResetTokenHash(null);
            user.setPasswordResetTokenExpiresAt(null);
            userRepository.save(user);
            return false;
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);
        return true;
    }

    private String generatePasswordResetToken() {
        byte[] tokenBytes = new byte[PASSWORD_RESET_TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String hashPasswordResetToken(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public AuthResponse googleLogin(GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getCredential());
            if (idToken == null) {
                throw new RuntimeException("Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String googleId = payload.getSubject();

            User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

            if (user != null) {
                if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
                    throw new RuntimeException("This account is inactive");
                }
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                    user.setIsVerified(true);
                    userRepository.save(user);
                }
            } else {
                user = User.builder()
                        .fullName(name != null ? name : "Google User")
                        .email(email)
                        .googleId(googleId)
                        .isVerified(true)
                        .role("USER")
                        .status("ACTIVE")
                        .createdAt(LocalDateTime.now())
                        .build();
                userRepository.save(user);
            }

            String token = jwtUtil.generateToken(user.getId());

            return AuthResponse.builder()
                    ._id(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .role(user.getRole())
                    .token(token)
                    .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                    .build();
        } catch (Exception e) {
            log.error("Google login failed", e);
            throw new RuntimeException("Google login failed: " + e.getMessage());
        }
    }
}
