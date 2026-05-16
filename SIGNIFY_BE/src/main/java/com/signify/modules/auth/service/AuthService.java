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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    public void registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User already exists");
        }

        String verificationToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
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
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (user.getIsVerified() != null && !user.getIsVerified()) {
            throw new RuntimeException("Please verify your email to login");
        }

        String token = jwtUtil.generateToken(user.getId());

        return AuthResponse.builder()
                ._id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .token(token)
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

            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null) {
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
                    .role(user.getRole())
                    .token(token)
                    .build();
        } catch (Exception e) {
            log.error("Google login failed", e);
            throw new RuntimeException("Google login failed: " + e.getMessage());
        }
    }
}
