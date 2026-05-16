package com.signify.modules.subscription.service;

import com.signify.modules.subscription.dto.response.ServicePackageResponse;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServicePackageService {

    private final ServicePackageRepository servicePackageRepository;

    public List<ServicePackageResponse> getAllPackages() {
        return servicePackageRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ServicePackageResponse mapToResponse(ServicePackage pkg) {
        return ServicePackageResponse.builder()
                .id(pkg.getId())
                .planType(pkg.getPlanType())
                .name(pkg.getName())
                .description(pkg.getDescription())
                .price(pkg.getPrice())
                .duration(pkg.getDuration())
                .buttonText(pkg.getButtonText())
                .isRecommended(pkg.getIsRecommended())
                .badge(pkg.getBadge())
                .features(pkg.getFeatures())
                .build();
    }
}
