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

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ServicePackageRepository servicePackageRepository;

    @Override
    public void run(String... args) {
        log.info("Syncing default service packages...");

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
                educationPackage(
                        "Gói Giáo dục - 1 tháng",
                        "5,000",
                        "tháng",
                        30,
                        50,
                        "Giải pháp cho trường học: tối đa 50 tài khoản giáo viên và học sinh trong 1 tháng.",
                        "Chọn Giáo dục 1 tháng",
                        false,
                        null
                ),
                educationPackage(
                        "Gói Giáo dục - 6 tháng",
                        "3,600,000",
                        "6 tháng",
                        180,
                        100,
                        "Giải pháp trường học 6 tháng, tối đa 100 tài khoản, quản lý lớp và tiến độ học tập.",
                        "Chọn Giáo dục 6 tháng",
                        true,
                        "Trường học chọn"
                ),
                educationPackage(
                        "Gói Giáo dục - 12 tháng",
                        "6,900,000",
                        "12 tháng",
                        365,
                        200,
                        "Giải pháp dài hạn cho trường học với tối đa 200 tài khoản và đầy đủ tính năng giáo dục.",
                        "Chọn Giáo dục 12 tháng",
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

    private ServicePackage educationPackage(
            String name,
            String price,
            String duration,
            Integer durationDays,
            Integer maxAccounts,
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
                .maxAccounts(maxAccounts)
                .fullFeatures(true)
                .buttonText(buttonText)
                .isRecommended(isRecommended)
                .badge(badge)
                .features(Arrays.asList(
                        new ServicePackage.Feature("GraduationCap", "Tối đa " + maxAccounts + " tài khoản giáo viên và học sinh"),
                        new ServicePackage.Feature("Shield", "01 tài khoản School Admin quản lý toàn bộ trường"),
                        new ServicePackage.Feature("Users", "Giáo viên tạo lớp, thêm học sinh và giao video học tập"),
                        new ServicePackage.Feature("LineChart", "Theo dõi tiến độ và đánh giá kết quả học tập của từng học sinh"),
                        new ServicePackage.Feature("Zap", "Toàn bộ thành viên được sử dụng đầy đủ các tính năng của Signify")
                ))
                .createdAt(LocalDateTime.now())
                .build();
    }
}
