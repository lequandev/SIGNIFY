package com.signify.config;

import com.signify.modules.school.model.School;
import com.signify.modules.school.model.SchoolMembership;
import com.signify.modules.school.repository.SchoolMembershipRepository;
import com.signify.modules.school.repository.SchoolRepository;
import com.signify.modules.user.model.Role;
import com.signify.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;

/**
 * One-off, idempotent migration from the legacy {@code business} domain to the
 * {@code school} domain.
 *
 * <p>Maps {@code business_organizations} → {@code schools} and
 * {@code business_memberships} → {@code school_memberships}, translating roles
 * {@code BUSINESS_ADMIN} → {@code SCHOOL_ADMIN} and {@code MEMBER} → {@code STUDENT}.
 *
 * <p>Runs before {@code DataInitializer}/{@code DataSeeder} is irrelevant; it is
 * safe to run repeatedly because it keys on {@code subscriptionId} (school) and
 * the {@code (schoolId, userId)} pair (membership) and skips rows that already
 * exist. Reads legacy collections as raw {@link Document}s since the old Java
 * model classes have been removed.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class BusinessToSchoolMigration implements CommandLineRunner {

    private static final String LEGACY_ORG_COLLECTION = "business_organizations";
    private static final String LEGACY_MEMBERSHIP_COLLECTION = "business_memberships";

    private static final String LEGACY_ROLE_ADMIN = "BUSINESS_ADMIN";
    private static final String LEGACY_ROLE_MEMBER = "MEMBER";

    private final MongoTemplate mongoTemplate;
    private final SchoolRepository schoolRepository;
    private final SchoolMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        if (!mongoTemplate.collectionExists(LEGACY_ORG_COLLECTION)
                && !mongoTemplate.collectionExists(LEGACY_MEMBERSHIP_COLLECTION)
                && !mongoTemplate.collectionExists("packages")) {
            log.info("No legacy business collections found; skipping business→school migration.");
            return;
        }

        int migratedSchools = migrateOrganizations();
        int migratedMemberships = migrateMemberships();
        int migratedPackages = migratePackageTypes();
        log.info("legacy organization migration complete: {} schools, {} memberships, {} packages migrated/verified.",
                migratedSchools, migratedMemberships, migratedPackages);
    }

    private int migrateOrganizations() {
        List<Document> orgs = mongoTemplate.findAll(Document.class, LEGACY_ORG_COLLECTION);
        int count = 0;
        for (Document org : orgs) {
            String subscriptionId = org.getString("subscriptionId");
            if (subscriptionId == null) {
                continue;
            }
            if (schoolRepository.findBySubscriptionId(subscriptionId).isPresent()) {
                continue; // already migrated
            }
            LocalDateTime now = LocalDateTime.now();
            School school = School.builder()
                    .id(objectIdToString(org.get("_id")))
                    .name(org.getString("name") != null ? org.getString("name") : "Trường học Signify")
                    .ownerUserId(org.getString("ownerUserId"))
                    .subscriptionId(subscriptionId)
                    .status(org.getString("status") != null ? org.getString("status") : "ACTIVE")
                    .createdAt(readDateTime(org.get("createdAt"), now))
                    .updatedAt(readDateTime(org.get("updatedAt"), now))
                    .build();
            schoolRepository.save(school);
            count++;
        }
        return count;
    }

    private int migrateMemberships() {
        List<Document> memberships = mongoTemplate.findAll(Document.class, LEGACY_MEMBERSHIP_COLLECTION);
        int count = 0;
        for (Document membership : memberships) {
            String schoolId = membership.getString("organizationId");
            String userId = membership.getString("userId");
            if (schoolId == null || userId == null) {
                continue;
            }
            if (membershipRepository.findBySchoolIdAndUserId(schoolId, userId).isPresent()) {
                continue; // already migrated
            }
            LocalDateTime now = LocalDateTime.now();
            SchoolMembership migrated = SchoolMembership.builder()
                    .id(objectIdToString(membership.get("_id")))
                    .schoolId(schoolId)
                    .userId(userId)
                    .role(mapRole(membership.getString("role")))
                    .status(membership.getString("status") != null ? membership.getString("status") : "ACTIVE")
                    .createdAt(readDateTime(membership.get("createdAt"), now))
                    .updatedAt(readDateTime(membership.get("updatedAt"), now))
                    .build();
            membershipRepository.save(migrated);
            userRepository.findById(userId).ifPresent(user -> {
                String mappedRole = migrated.getRole();
                if (Role.SCHOOL_ADMIN.equals(mappedRole) || Role.TEACHER.equals(mappedRole) || Role.STUDENT.equals(mappedRole)) {
                    user.setRole(mappedRole);
                    user.setStatus("ACTIVE");
                    userRepository.save(user);
                }
            });
            count++;
        }
        return count;
    }

    private int migratePackageTypes() {
        if (!mongoTemplate.collectionExists("packages")) return 0;
        int count = 0;
        for (Document pkg : mongoTemplate.findAll(Document.class, "packages")) {
            if ("business".equalsIgnoreCase(pkg.getString("planType")) && pkg.get("_id") != null) {
                mongoTemplate.getCollection("packages").updateOne(
                        Filters.eq("_id", pkg.get("_id")), Updates.set("planType", "education"));
                count++;
            }
        }
        return count;
    }

    private String mapRole(String legacyRole) {
        if (LEGACY_ROLE_ADMIN.equals(legacyRole)) {
            return Role.SCHOOL_ADMIN;
        }
        if (LEGACY_ROLE_MEMBER.equals(legacyRole)) {
            return Role.STUDENT;
        }
        // Already-new roles pass through unchanged.
        return legacyRole != null ? legacyRole : Role.STUDENT;
    }

    private String objectIdToString(Object id) {
        return id != null ? id.toString() : null;
    }

    private LocalDateTime readDateTime(Object value, LocalDateTime fallback) {
        if (value instanceof java.util.Date date) {
            return date.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt;
        }
        return fallback;
    }
}
