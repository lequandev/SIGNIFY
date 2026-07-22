package com.signify.config;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.IndexOptions;
import com.signify.modules.user.model.Role;
import com.signify.modules.user.model.User;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class UserLoginMigration implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        migrateStudentUsernames();
        ensureSparseLoginIndexes();
    }

    private void migrateStudentUsernames() {
        int migrated = 0;
        for (User user : userRepository.findAll()) {
            if (!Role.STUDENT.equals(user.getRole()) || (user.getUsername() != null && !user.getUsername().isBlank())) {
                continue;
            }
            user.setUsername(generateLegacyUsername(user));
            userRepository.save(user);
            migrated++;
        }
        if (migrated > 0) log.info("Generated login IDs for {} existing students", migrated);
    }

    private String generateLegacyUsername(User user) {
        String id = user.getId() == null ? "STUDENT" : user.getId().replaceAll("[^A-Za-z0-9]", "");
        String suffix = id.length() <= 8 ? id : id.substring(id.length() - 8);
        String base = ("HS-" + suffix).toUpperCase(Locale.ROOT);
        String candidate = base;
        int counter = 1;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + "-" + counter++;
        }
        return candidate;
    }

    private void ensureSparseLoginIndexes() {
        MongoCollection<Document> users = mongoTemplate.getCollection("users");
        boolean emailReady = false;
        boolean usernameReady = false;
        for (Document index : users.listIndexes()) {
            Document key = index.get("key", Document.class);
            if (key == null || key.size() != 1) continue;
            String name = index.getString("name");
            boolean unique = Boolean.TRUE.equals(index.getBoolean("unique"));
            boolean sparse = Boolean.TRUE.equals(index.getBoolean("sparse"));
            if (key.containsKey("email")) {
                if (unique && sparse) emailReady = true;
                else if (name != null && !"_id_".equals(name)) users.dropIndex(name);
            }
            if (key.containsKey("username")) {
                if (unique && sparse) usernameReady = true;
                else if (name != null && !"_id_".equals(name)) users.dropIndex(name);
            }
        }
        if (!emailReady) {
            users.createIndex(new Document("email", 1),
                    new IndexOptions().unique(true).sparse(true).name("email_unique_sparse"));
        }
        if (!usernameReady) {
            users.createIndex(new Document("username", 1),
                    new IndexOptions().unique(true).sparse(true).name("username_unique_sparse"));
        }
    }
}
