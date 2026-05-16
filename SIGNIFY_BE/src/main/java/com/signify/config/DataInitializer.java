package com.signify.config;

import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeAdminUser();
    }

    private void initializeAdminUser() {
        String adminEmail = "admin@signify.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .fullName("Signify Admin")
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode("signify123"))
                    .role("ADMIN")
                    .status("ACTIVE")
                    .isVerified(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            userRepository.save(admin);
            log.info("Admin user created successfully: {}", adminEmail);
        } else {
            log.info("Admin user already exists: {}", adminEmail);
        }
    }
}
