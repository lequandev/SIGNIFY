package com.signify.modules.subscription.controller;

import com.signify.modules.subscription.dto.response.ServicePackageResponse;
import com.signify.modules.subscription.service.ServicePackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/service-packages")
@RequiredArgsConstructor
public class ServicePackageController {

    private final ServicePackageService servicePackageService;

    @GetMapping
    public List<ServicePackageResponse> getAllPackages() {
        return servicePackageService.getAllPackages();
    }
}
