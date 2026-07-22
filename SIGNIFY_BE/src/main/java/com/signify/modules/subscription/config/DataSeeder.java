package com.signify.modules.subscription.config;

import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private static final int DEFAULT_EDUCATION_MONTHLY_AI_MINUTES = 10000;
    private static final int DEFAULT_PERSONAL_MONTHLY_AI_MINUTES = 800;

    private final ServicePackageRepository servicePackageRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) {
        log.info("Syncing default service packages and MongoDB collections...");

        if (!mongoTemplate.collectionExists("youtube_videos")) {
            mongoTemplate.createCollection("youtube_videos");
            log.info("Collection 'youtube_videos' created automatically on startup.");
        }

        List<ServicePackage> defaults = Arrays.asList(
                personalPackage(
                        "Gói Cá nhân - 1 tháng",
                        "5,000",
                        "tháng",
                        30,
                        "Truy cập đầy đủ Signify trong 1 tháng với 800 phút AI mỗi tháng.",
                        "Chọn gói 1 tháng",
                        false,
                        null
                ),
                personalPackage(
                        "Gói Cá nhân - 6 tháng",
                        "250,000",
                        "6 tháng",
                        180,
                        "Tiết kiệm hơn khi sử dụng đầy đủ các tính năng Signify trong 6 tháng.",
                        "Chọn gói 6 tháng",
                        true,
                        "Tiết kiệm"
                ),
                personalPackage(
                        "Gói Cá nhân - 12 tháng",
                        "489,000",
                        "12 tháng",
                        365,
                        "Gói cá nhân tốt nhất cho người dùng muốn sử dụng Signify lâu dài.",
                        "Chọn gói 12 tháng",
                        false,
                        "Tốt nhất"
                ),
                educationPackage(
                        "Gói Giáo dục - 1 tháng",
                        "2,000,000",
                        "tháng",
                        30,
                        DEFAULT_EDUCATION_MONTHLY_AI_MINUTES,
                        "Giải pháp cho tổ chức với 10.000 phút AI mỗi tháng và không giới hạn thành viên.",
                        "Chọn Giáo dục 1 tháng",
                        false,
                        null
                ),
                educationPackage(
                        "Gói Giáo dục - 6 tháng",
                        "3,600,000",
                        "6 tháng",
                        180,
                        DEFAULT_EDUCATION_MONTHLY_AI_MINUTES,
                        "Giải pháp trường học 6 tháng với quota AI dùng chung, quản lý lớp và tiến độ học tập.",
                        "Chọn Giáo dục 6 tháng",
                        true,
                        "Trường học chọn"
                ),
                educationPackage(
                        "Gói Giáo dục - 12 tháng",
                        "6,900,000",
                        "12 tháng",
                        365,
                        DEFAULT_EDUCATION_MONTHLY_AI_MINUTES,
                        "Giải pháp dài hạn với 10.000 phút AI mỗi tháng và đầy đủ tính năng quản lý tổ chức.",
                        "Chọn Giáo dục 12 tháng",
                        false,
                        "Dài hạn"
                )
        );

        defaults.forEach(this::upsertDefaultPackage);
        sanitizeLegacyEducationPackages();
        log.info("Default service packages synced successfully.");
    }

    private void upsertDefaultPackage(ServicePackage desired) {
        List<ServicePackage> matches = servicePackageRepository.findAllByPlanTypeAndDurationDays(
                desired.getPlanType(),
                desired.getDurationDays()
        );

        ServicePackage pkg = matches.isEmpty() ? new ServicePackage() : matches.get(0);
        pkg.setPlanType(desired.getPlanType());
        pkg.setName(desired.getName());
        pkg.setDescription(desired.getDescription());
        pkg.setPrice(desired.getPrice());
        pkg.setDuration(desired.getDuration());
        pkg.setDurationDays(desired.getDurationDays());
        pkg.setAiLimitPerDay(desired.getAiLimitPerDay());
        pkg.setDailyUsageMinutes(desired.getDailyUsageMinutes());
        pkg.setMonthlyAiMinutes(desired.getMonthlyAiMinutes());
        pkg.setFullFeatures(desired.getFullFeatures());
        pkg.setButtonText(desired.getButtonText());
        pkg.setIsRecommended(desired.getIsRecommended());
        pkg.setBadge(desired.getBadge());
        pkg.setFeatures(desired.getFeatures());
        if (pkg.getCreatedAt() == null) {
            pkg.setCreatedAt(LocalDateTime.now());
        }

        servicePackageRepository.save(pkg);
    }

    private ServicePackage personalPackage(
            String name,
            String price,
            String duration,
            Integer durationDays,
            String description,
            String buttonText,
            Boolean isRecommended,
            String badge
    ) {
        return ServicePackage.builder()
                .planType("individual")
                .name(name)
                .price(price)
                .duration(duration)
                .durationDays(durationDays)
                .description(description)
                .aiLimitPerDay(null)
                .dailyUsageMinutes(null)
                .monthlyAiMinutes(DEFAULT_PERSONAL_MONTHLY_AI_MINUTES)
                .fullFeatures(true)
                .buttonText(buttonText)
                .isRecommended(isRecommended)
                .badge(badge)
                .features(Arrays.asList(
                        new ServicePackage.Feature("Zap", "800 phút AI mỗi tháng"),
                        new ServicePackage.Feature("Plus", "Mua thêm 200 phút AI với giá 29.000đ khi hết quota"),
                        new ServicePackage.Feature("Cpu", "Truy cập đầy đủ các tính năng của Signify"),
                        new ServicePackage.Feature("Sparkles", "Nhận các cập nhật tính năng mới trong thời gian gói còn hiệu lực")
                ))
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ServicePackage educationPackage(
            String name,
            String price,
            String duration,
            Integer durationDays,
            Integer monthlyAiMinutes,
            String description,
            String buttonText,
            Boolean isRecommended,
            String badge
    ) {
        return ServicePackage.builder()
                .planType("education")
                .name(name)
                .price(price)
                .duration(duration)
                .durationDays(durationDays)
                .description(description)
                .aiLimitPerDay(null)
                .dailyUsageMinutes(null)
                .monthlyAiMinutes(monthlyAiMinutes)
                .fullFeatures(true)
                .buttonText(buttonText)
                .isRecommended(isRecommended)
                .badge(badge)
                .features(Arrays.asList(
                        new ServicePackage.Feature("Cpu", formatMinutes(monthlyAiMinutes) + " phút AI mỗi tháng"),
                        new ServicePackage.Feature("Plus", "Mua thêm 1.000 phút AI với giá 399.000đ khi hết quota"),
                        new ServicePackage.Feature("Shield", "01 tài khoản School Admin quản lý toàn bộ trường"),
                        new ServicePackage.Feature("GraduationCap", "Không giới hạn tài khoản giáo viên và học sinh"),
                        new ServicePackage.Feature("Users", "Giáo viên tạo lớp, thêm học sinh và giao video học tập"),
                        new ServicePackage.Feature("LineChart", "Theo dõi tiến độ và đánh giá kết quả học tập của từng học sinh"),
                        new ServicePackage.Feature("Zap", "Toàn bộ thành viên được sử dụng đầy đủ các tính năng của Signify")
                ))
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void sanitizeLegacyEducationPackages() {
        for (ServicePackage pkg : servicePackageRepository.findAll()) {
            if (!"education".equalsIgnoreCase(pkg.getPlanType())) continue;
            boolean changed = false;
            if (pkg.getMonthlyAiMinutes() == null || pkg.getMonthlyAiMinutes() <= 0) {
                pkg.setMonthlyAiMinutes(DEFAULT_EDUCATION_MONTHLY_AI_MINUTES);
                changed = true;
            }

            if (containsAccountLimit(pkg.getDescription())) {
                pkg.setDescription("Giải pháp trường học với quota AI dùng chung, không giới hạn thành viên và đầy đủ tính năng quản lý giáo dục.");
                changed = true;
            }

            List<ServicePackage.Feature> features = new ArrayList<>();
            if (pkg.getFeatures() != null) {
                for (ServicePackage.Feature feature : pkg.getFeatures()) {
                    if (feature != null && containsAccountLimit(feature.getText())) {
                        changed = true;
                        continue;
                    }
                    if (feature != null) features.add(feature);
                }
            }
            boolean hasAiUsage = features.stream().anyMatch(feature -> feature.getText() != null
                    && feature.getText().toLowerCase().contains("phút ai"));
            boolean hasUnlimitedMembers = features.stream().anyMatch(feature -> feature.getText() != null
                    && feature.getText().toLowerCase().contains("không giới hạn tài khoản"));
            if (!hasAiUsage) {
                features.add(0, new ServicePackage.Feature("Cpu",
                        formatMinutes(pkg.getMonthlyAiMinutes()) + " phút AI mỗi tháng"));
                changed = true;
            }
            if (!hasUnlimitedMembers) {
                features.add(new ServicePackage.Feature("GraduationCap",
                        "Không giới hạn tài khoản giáo viên và học sinh"));
                changed = true;
            }
            if (changed) {
                pkg.setFeatures(features);
                servicePackageRepository.save(pkg);
            }
        }
    }

    private boolean containsAccountLimit(String value) {
        if (value == null) return false;
        String normalized = value.toLowerCase();
        return normalized.contains("tối đa") && normalized.contains("tài khoản");
    }

    private String formatMinutes(Integer minutes) {
        return String.format("%,d", minutes).replace(',', '.');
    }
}
