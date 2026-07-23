package com.signify.modules.user.repository;

import com.signify.modules.user.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByVerificationToken(String verificationToken);
    Optional<User> findByPasswordResetTokenHash(String passwordResetTokenHash);
    Boolean existsByEmail(String email);
    Boolean existsByUsernameIgnoreCase(String username);
}
