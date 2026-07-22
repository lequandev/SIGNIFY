package com.signify.modules.subscription.service;

import com.signify.modules.subscription.dto.PackageRequest;
import com.signify.modules.subscription.dto.response.ServicePackageResponse;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicePackageService {

    private static final int DEFAULT_ORGANIZATION_AI_MINUTES = 10000;
    private static final int DEFAULT_PERSONAL_AI_MINUTES = 800;
    private final ServicePackageRepository servicePackageRepository;

    public List<ServicePackageResponse> getAllPackages() {
        return servicePackageRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ServicePackageResponse createPackage(PackageRequest request) {
        String formattedPrice;
        if (request.getPrice() != null) {
            formattedPrice = String.format("%,d", request.getPrice().longValue());
        } else {
            formattedPrice = "0";
        }

        Integer durationDays = request.getDurationDays() != null ? request.getDurationDays() : 30;
        String durationText;
        if (durationDays == 30) {
            durationText = "tháng";
        } else if (durationDays == 180) {
            durationText = "6 tháng";
        } else if (durationDays == 365) {
            durationText = "năm";
        } else {
            durationText = durationDays + " ngày";
        }

        ServicePackage pkg = ServicePackage.builder()
                .planType(request.getPlanType() != null ? request.getPlanType() : "individual")
                .name(request.getName())
                .description(request.getDescription())
                .price(formattedPrice)
                .duration(durationText)
                .durationDays(durationDays)
                .aiLimitPerDay(request.getAiLimitPerDay() != null ? request.getAiLimitPerDay() : 10)
                .dailyUsageMinutes(request.getDailyUsageMinutes())
                .monthlyAiMinutes(request.getMonthlyAiMinutes() != null
                        ? request.getMonthlyAiMinutes()
                        : "education".equalsIgnoreCase(request.getPlanType())
                                ? DEFAULT_ORGANIZATION_AI_MINUTES
                                : DEFAULT_PERSONAL_AI_MINUTES)
                .fullFeatures(request.getFullFeatures() != null ? request.getFullFeatures() : true)
                .buttonText("Bắt Đầu Ngay")
                .isRecommended(false)
                .features(buildFeatures(request.getPlanType(), request.getMonthlyAiMinutes()))
                .createdAt(LocalDateTime.now())
                .build();

        ServicePackage saved = servicePackageRepository.save(pkg);
        return mapToResponse(saved);
    }

    public ServicePackageResponse updatePackage(String id, PackageRequest request) {
        ServicePackage pkg = servicePackageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found"));

        if (request.getName() != null) {
            pkg.setName(request.getName());
        }
        if (request.getDescription() != null) {
            pkg.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            pkg.setPrice(String.format("%,d", request.getPrice().longValue()));
        }
        if (request.getDurationDays() != null) {
            pkg.setDurationDays(request.getDurationDays());
            Integer durationDays = request.getDurationDays();
            String durationText;
            if (durationDays == 30) {
                durationText = "tháng";
            } else if (durationDays == 180) {
                durationText = "6 tháng";
            } else if (durationDays == 365) {
                durationText = "năm";
            } else {
                durationText = durationDays + " ngày";
            }
            pkg.setDuration(durationText);
        }
        if (request.getAiLimitPerDay() != null) {
            pkg.setAiLimitPerDay(request.getAiLimitPerDay());
        }
        if (request.getPlanType() != null) {
            pkg.setPlanType(request.getPlanType());
            if (request.getMonthlyAiMinutes() == null) {
                pkg.setMonthlyAiMinutes("education".equalsIgnoreCase(request.getPlanType())
                        ? DEFAULT_ORGANIZATION_AI_MINUTES
                        : DEFAULT_PERSONAL_AI_MINUTES);
            }
        }
        if (request.getDailyUsageMinutes() != null) {
            pkg.setDailyUsageMinutes(request.getDailyUsageMinutes());
        }
        if (request.getMonthlyAiMinutes() != null) {
            pkg.setMonthlyAiMinutes(request.getMonthlyAiMinutes());
        }
        if (request.getFullFeatures() != null) {
            pkg.setFullFeatures(request.getFullFeatures());
        }

        ServicePackage updated = servicePackageRepository.save(pkg);
        return mapToResponse(updated);
    }

    public void deletePackage(String id) {
        if (!servicePackageRepository.existsById(id)) {
            throw new RuntimeException("Package not found");
        }
        servicePackageRepository.deleteById(id);
    }

    private List<ServicePackage.Feature> buildFeatures(String planType, Integer monthlyAiMinutes) {
        if ("education".equalsIgnoreCase(planType)) {
            int minutes = monthlyAiMinutes != null && monthlyAiMinutes > 0
                    ? monthlyAiMinutes : DEFAULT_ORGANIZATION_AI_MINUTES;
            return Arrays.asList(
                    new ServicePackage.Feature("Cpu", String.format("%,d", minutes).replace(',', '.') + " phút AI mỗi tháng"),
                    new ServicePackage.Feature("Plus", "Mua thêm 1.000 phút AI với giá 399.000đ khi hết quota"),
                    new ServicePackage.Feature("GraduationCap", "Không giới hạn tài khoản giáo viên và học sinh"),
                    new ServicePackage.Feature("Users", "Quản lý lớp học, thành viên và tiến độ tập trung"),
                    new ServicePackage.Feature("Shield", "01 tài khoản School Admin quản lý toàn bộ trường")
            );
        }
        return Arrays.asList(
                new ServicePackage.Feature("Cpu", String.format("%,d", monthlyAiMinutes != null && monthlyAiMinutes > 0
                        ? monthlyAiMinutes : DEFAULT_PERSONAL_AI_MINUTES).replace(',', '.') + " phút AI mỗi tháng"),
                new ServicePackage.Feature("Plus", "Mua thêm 200 phút AI với giá 29.000đ khi hết quota"),
                new ServicePackage.Feature("Globe", "Hỗ trợ tất cả các phương ngữ ngôn ngữ ký hiệu"),
                new ServicePackage.Feature("Shield", "Trải nghiệm hoàn toàn không quảng cáo")
        );
    }

    private ServicePackageResponse mapToResponse(ServicePackage pkg) {
        return ServicePackageResponse.builder()
                .id(pkg.getId())
                .planType(pkg.getPlanType())
                .name(pkg.getName())
                .description(pkg.getDescription())
                .price(pkg.getPrice())
                .duration(pkg.getDuration())
                .durationDays(pkg.getDurationDays())
                .aiLimitPerDay(pkg.getAiLimitPerDay())
                .dailyUsageMinutes(pkg.getDailyUsageMinutes())
                .monthlyAiMinutes(pkg.getMonthlyAiMinutes())
                .fullFeatures(pkg.getFullFeatures())
                .buttonText(pkg.getButtonText())
                .isRecommended(pkg.getIsRecommended())
                .badge(pkg.getBadge())
                .features(buildFeatures(pkg.getPlanType(), pkg.getMonthlyAiMinutes()))
                .build();
    }
}
