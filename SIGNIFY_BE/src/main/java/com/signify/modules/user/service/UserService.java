package com.signify.modules.user.service;

import com.signify.modules.media.service.CloudinaryService;
import com.signify.modules.user.dto.ChangePasswordRequest;
import com.signify.modules.user.dto.UpdateProfileRequest;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;

    public User getProfile(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(String userId, UpdateProfileRequest request) {
        User user = getProfile(userId);
        if (request.getFullName() != null) user.setFullName(request.getFullName().trim());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getAddress() != null) user.setAddress(request.getAddress().trim());
        return userRepository.save(user);
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = getProfile(userId);
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new RuntimeException("Tài khoản này đăng nhập bằng Google, không thể đổi mật khẩu.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public User updateAvatar(String userId, MultipartFile file) {
        User user = getProfile(userId);
        String url = cloudinaryService.uploadAvatar(file, userId);
        user.setAvatarUrl(url);
        return userRepository.save(user);
    }
}
