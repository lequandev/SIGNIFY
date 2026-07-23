package com.signify.modules.auth.service;

import com.signify.modules.auth.util.JwtUtil;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServicePasswordResetTest {

    private static final Pattern TOKEN_PATTERN =
            Pattern.compile("/reset-password\\?token=([A-Za-z0-9_-]+)");

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendUrl", "https://frontend.test/");
    }

    @Test
    void requestPasswordResetReturnsFalseWhenEmailDoesNotExist() {
        when(userRepository.findByEmailIgnoreCase("missing@example.com"))
                .thenReturn(Optional.empty());

        boolean result = authService.requestPasswordReset(" Missing@Example.com ");

        assertFalse(result);
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(emailService);
    }

    @Test
    void requestPasswordResetStoresHashAndSendsExpiringLink() {
        User user = User.builder().email("user@example.com").build();
        when(userRepository.findByEmailIgnoreCase("user@example.com"))
                .thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);

        boolean result = authService.requestPasswordReset("USER@example.com");

        assertTrue(result);
        assertNotNull(user.getPasswordResetTokenHash());
        assertNotNull(user.getPasswordResetTokenExpiresAt());
        assertTrue(user.getPasswordResetTokenExpiresAt().isAfter(LocalDateTime.now().plusMinutes(29)));
        verify(emailService).sendHtmlEmail(
                eq("user@example.com"), eq("Đặt lại mật khẩu Signify"), contentCaptor.capture());

        Matcher matcher = TOKEN_PATTERN.matcher(contentCaptor.getValue());
        assertTrue(matcher.find());
        assertNotEquals(matcher.group(1), user.getPasswordResetTokenHash());
    }

    @Test
    void requestPasswordResetClearsTokenWhenEmailCannotBeSent() {
        User user = User.builder().email("user@example.com").build();
        when(userRepository.findByEmailIgnoreCase("user@example.com"))
                .thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        org.mockito.Mockito.doThrow(new RuntimeException("mail unavailable"))
                .when(emailService).sendHtmlEmail(anyString(), anyString(), anyString());

        assertThrows(RuntimeException.class,
                () -> authService.requestPasswordReset("user@example.com"));

        assertNull(user.getPasswordResetTokenHash());
        assertNull(user.getPasswordResetTokenExpiresAt());
    }

    @Test
    void resetPasswordUpdatesPasswordAndConsumesToken() {
        User user = User.builder()
                .email("user@example.com")
                .passwordResetTokenHash("stored-hash")
                .passwordResetTokenExpiresAt(LocalDateTime.now().plusMinutes(10))
                .mustChangePassword(true)
                .build();
        when(userRepository.findByPasswordResetTokenHash(anyString()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-password"))
                .thenReturn("encoded-new-password");

        boolean result = authService.resetPassword("valid-token", "new-password");

        assertTrue(result);
        assertTrue("encoded-new-password".equals(user.getPasswordHash()));
        assertFalse(user.getMustChangePassword());
        assertNull(user.getPasswordResetTokenHash());
        assertNull(user.getPasswordResetTokenExpiresAt());
        verify(userRepository).save(user);
    }

    @Test
    void resetPasswordRejectsAndConsumesExpiredToken() {
        User user = User.builder()
                .passwordResetTokenHash("stored-hash")
                .passwordResetTokenExpiresAt(LocalDateTime.now().minusSeconds(1))
                .build();
        when(userRepository.findByPasswordResetTokenHash(anyString()))
                .thenReturn(Optional.of(user));

        boolean result = authService.resetPassword("expired-token", "new-password");

        assertFalse(result);
        verify(passwordEncoder, never()).encode(anyString());
        assertNull(user.getPasswordResetTokenHash());
        assertNull(user.getPasswordResetTokenExpiresAt());
        verify(userRepository).save(user);
    }
}
