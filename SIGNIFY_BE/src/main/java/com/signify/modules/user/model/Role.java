package com.signify.modules.user.model;

/**
 * Centralized role constants for the Signify for Education platform.
 *
 * <p>Roles are stored on {@link User#getRole()} as plain strings. Spring Security
 * authorities are derived by prefixing with {@code ROLE_} (see JwtFilter), so
 * {@code hasRole("ADMIN")} matches a user whose role is {@code ADMIN}.
 */
public final class Role {

    private Role() {
    }

    /** Platform super administrator. */
    public static final String ADMIN = "ADMIN";

    /** Administrator of a single school (owner of the education subscription). */
    public static final String SCHOOL_ADMIN = "SCHOOL_ADMIN";

    /** Teacher within a school: manages classes, students and assignments. */
    public static final String TEACHER = "TEACHER";

    /** Student within a school: consumes assignments via web + extension. */
    public static final String STUDENT = "STUDENT";

    /** Legacy individual user role (pre-education platform). */
    public static final String USER = "USER";
}
