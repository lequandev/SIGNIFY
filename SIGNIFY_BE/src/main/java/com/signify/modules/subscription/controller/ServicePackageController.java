package com.signify.modules.subscription.controller;

import com.signify.modules.subscription.dto.PackageRequest;
import com.signify.modules.subscription.dto.response.ServicePackageResponse;
import com.signify.modules.subscription.service.ServicePackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServicePackageResponse createPackage(@RequestBody PackageRequest request) {
        return servicePackageService.createPackage(request);
    }

    @PutMapping("/{id}")
    public ServicePackageResponse updatePackage(@PathVariable String id, @RequestBody PackageRequest request) {
        return servicePackageService.updatePackage(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePackage(@PathVariable String id) {
        servicePackageService.deletePackage(id);
    }
}
