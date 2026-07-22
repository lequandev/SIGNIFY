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
                        "49,000",
                        "tháng",
                        30,
                        "Truy cập đầy đủ Signify trong 1 tháng với thời gian sử dụng không giới hạn mỗi ngày.",
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
                businessPackage(
                        "Gói Doanh nghiệp - 1 tháng",
                        "500,000",
                        "tháng",
                        30,
                        "Quản lý tối đa 20 tài khoản trong một doanh nghiệp trong 1 tháng.",
                        "Chọn Business 1 tháng",
                        false,
                        null
                ),
                businessPackage(
                        "Gói Doanh nghiệp - 6 tháng",
                        "2,799,000",
                        "6 tháng",
                        180,
                        "Giải pháp doanh nghiệp 6 tháng cho đội nhóm cần quản lý thành viên tập trung.",
                        "Chọn Business 6 tháng",
                        true,
                        "Doanh nghiệp chọn"
                ),
                businessPackage(
                        "Gói Doanh nghiệp - 12 tháng",
                        "5,500,000",
                        "12 tháng",
                        365,
                        "Giải pháp dài hạn cho doanh nghiệp với đầy đủ quyền quản lý thành viên.",
                        "Chọn Business 12 tháng",
                        false,
                        "Dài hạn"
                )
        );

        defaults.forEach(this::upsertDefaultPackage);
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
        pkg.setMaxAccounts(desired.getMaxAccounts());
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
                .maxAccounts(null)
                .fullFeatures(true)
                .buttonText(buttonText)
                .isRecommended(isRecommended)
                .badge(badge)
                .features(Arrays.asList(
                        new ServicePackage.Feature("Zap", "Sử dụng không giới hạn thời gian mỗi ngày"),
                        new ServicePackage.Feature("Cpu", "Truy cập đầy đủ các tính năng của Signify"),
                        new ServicePackage.Feature("Sparkles", "Nhận các cập nhật tính năng mới trong thời gian gói còn hiệu lực")
                ))
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ServicePackage businessPackage(
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
                .planType("business")
                .name(name)
                .price(price)
                .duration(duration)
                .durationDays(durationDays)
                .description(description)
                .aiLimitPerDay(null)
                .dailyUsageMinutes(null)
                .maxAccounts(20)
                .fullFeatures(true)
                .buttonText(buttonText)
                .isRecommended(isRecommended)
                .badge(badge)
                .features(Arrays.asList(
                        new ServicePackage.Feature("Users", "Tối đa 20 tài khoản trong một doanh nghiệp"),
                        new ServicePackage.Feature("Shield", "01 tài khoản Admin quản lý toàn bộ doanh nghiệp"),
                        new ServicePackage.Feature("UserCog", "Admin có thể thêm, xóa, kích hoạt hoặc vô hiệu hóa tài khoản thành viên"),
                        new ServicePackage.Feature("Globe", "Quản lý danh sách thành viên và quyền truy cập trên một hệ thống tập trung"),
                        new ServicePackage.Feature("Zap", "Toàn bộ thành viên được sử dụng đầy đủ các tính năng của Signify")
                ))
                .createdAt(LocalDateTime.now())
                .build();
    }
}
