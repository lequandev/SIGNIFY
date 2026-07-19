package com.signify.modules.business.controller;

import com.signify.modules.business.dto.request.AddBusinessMemberRequest;
import com.signify.modules.business.dto.request.UpdateBusinessMemberStatusRequest;
import com.signify.modules.business.dto.response.BusinessInvitationResponse;
import com.signify.modules.business.dto.response.BusinessMemberResponse;
import com.signify.modules.business.dto.response.BusinessOverviewResponse;
import com.signify.modules.business.service.BusinessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/businesses/me")
@RequiredArgsConstructor
public class BusinessController {

    private final BusinessService businessService;

    @GetMapping
    public ResponseEntity<?> getMyBusiness() {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            BusinessOverviewResponse response = businessService.getMyBusiness(userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleBusinessException(e);
        }
    }

    @GetMapping("/members")
    public ResponseEntity<?> getMembers() {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            List<BusinessMemberResponse> response = businessService.getMembers(userId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleBusinessException(e);
        }
    }

    @PostMapping("/members")
    public ResponseEntity<?> addMember(@Valid @RequestBody AddBusinessMemberRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            BusinessInvitationResponse response = businessService.addMember(userId, request.getEmail());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleBusinessException(e);
        }
    }

    @PostMapping("/invitations/{token}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable String token) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            BusinessMemberResponse response = businessService.acceptInvitation(userId, token);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleBusinessException(e);
        }
    }

    @PatchMapping("/members/{memberId}/status")
    public ResponseEntity<?> updateMemberStatus(@PathVariable String memberId,
                                                @Valid @RequestBody UpdateBusinessMemberStatusRequest request) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            BusinessMemberResponse response = businessService.updateMemberStatus(userId, memberId, request.getStatus());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return handleBusinessException(e);
        }
    }

    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<?> deleteMember(@PathVariable String memberId) {
        String userId = getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        try {
            businessService.deleteMember(userId, memberId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return handleBusinessException(e);
        }
    }

    private ResponseEntity<?> handleBusinessException(RuntimeException e) {
        if (BusinessService.isBusinessNotFound(e)) {
            return ResponseEntity.status(404).body(Map.of("message", "Bạn chưa thuộc doanh nghiệp nào."));
        }
        if (BusinessService.isBusinessForbidden(e)) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không có quyền quản lý doanh nghiệp này."));
        }
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }
}
