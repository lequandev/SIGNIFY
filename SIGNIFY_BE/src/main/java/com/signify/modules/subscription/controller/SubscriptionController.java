package com.signify.modules.subscription.controller;

import com.signify.modules.subscription.dto.PackageRequest;
import com.signify.modules.subscription.dto.SubscribeRequest;
import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.model.Subscription;
import com.signify.modules.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<ServicePackage> createPackage(@RequestBody PackageRequest request) {
        return ResponseEntity.ok(subscriptionService.createPackage(request));
    }

    @GetMapping
    public ResponseEntity<List<ServicePackage>> getAllPackages() {
        return ResponseEntity.ok(subscriptionService.getAllPackages());
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Subscription> subscribe(@RequestBody SubscribeRequest request) {
        return ResponseEntity.ok(subscriptionService.subscribe(request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Subscription>> getUserSubscriptions(@PathVariable String userId) {
        return ResponseEntity.ok(subscriptionService.getUserSubscriptions(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServicePackage> updatePackage(@PathVariable String id, @RequestBody PackageRequest request) {
        return ResponseEntity.ok(subscriptionService.updatePackage(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePackage(@PathVariable String id) {
        subscriptionService.deletePackage(id);
        return ResponseEntity.ok().build();
    }
}
