package com.signify.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(request -> {
                org.springframework.web.cors.CorsConfiguration config = new org.springframework.web.cors.CorsConfiguration();
                config.setAllowedOriginPatterns(java.util.List.of(allowedOrigins.split(",")));
                config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(java.util.List.of("*"));
                config.setAllowCredentials(true);
                return config;
            }))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authorize -> authorize
                // Preflight
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                // Public auth endpoints (auth + user share the /api/users base)
                .requestMatchers("/api/users/register", "/api/users/login",
                        "/api/users/google-login", "/api/users/verify/**").permitAll()

                // Service packages: public read, admin-only mutations
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/service-packages/**").permitAll()
                .requestMatchers("/api/v1/service-packages/**").hasRole("ADMIN")

                // Payment webhook is called by PayOS (no JWT)
                .requestMatchers("/api/payments/webhook").permitAll()

                // Admin console
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // School management: any authenticated user; fine-grained role/ownership
                // checks (SCHOOL_ADMIN etc.) are enforced in the service layer.
                .requestMatchers("/api/v1/schools/**").authenticated()
                .requestMatchers("/api/v1/classes/**").hasRole("TEACHER")
                .requestMatchers("/api/v1/evaluations/**").hasAnyRole("TEACHER", "SCHOOL_ADMIN")
                .requestMatchers("/api/v1/students/**").hasAnyRole("TEACHER", "SCHOOL_ADMIN")
                .requestMatchers("/api/v1/assignments/**", "/api/v1/me/**").authenticated()

                // AI endpoints return their own AUTH_REQUIRED/quota responses so the
                // existing extension flow can handle them without a Spring 403.
                .requestMatchers("/api/ai/**").permitAll()

                // Everything else requires a valid JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }
}
