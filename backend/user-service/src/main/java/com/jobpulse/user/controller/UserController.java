package com.jobpulse.user.controller;

import com.jobpulse.user.dto.AuthRequest;
import com.jobpulse.user.dto.AuthResponse;
import com.jobpulse.user.dto.RegisterRequest;
import com.jobpulse.user.model.User;
import com.jobpulse.user.model.UserAlert;
import com.jobpulse.user.repository.UserRepository;
import com.jobpulse.user.service.UserAlertService;
import com.jobpulse.user.service.UserAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserAuthService authService;
    private final UserAlertService alertService;
    private final UserRepository userRepository;

    // ── Auth endpoints ───────────────────────────────────────────────────────

    @PostMapping("/api/auth/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/api/auth/me")
    public ResponseEntity<User> me(@RequestHeader("X-User-Id") String userId) {
        return userRepository.findById(UUID.fromString(userId))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Profile endpoints ────────────────────────────────────────────────────

    @PutMapping("/api/users/profile")
    public ResponseEntity<User> updateProfile(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody User updates) {
        return userRepository.findById(UUID.fromString(userId)).map(user -> {
            if (updates.getFullName() != null) user.setFullName(updates.getFullName());
            if (updates.getSkills() != null) user.setSkills(updates.getSkills());
            if (updates.getPreferredRoles() != null) user.setPreferredRoles(updates.getPreferredRoles());
            if (updates.getPreferredLocations() != null) user.setPreferredLocations(updates.getPreferredLocations());
            if (updates.getPreferredSalaryMin() != null) user.setPreferredSalaryMin(updates.getPreferredSalaryMin());
            if (updates.getRemotePreference() != null) user.setRemotePreference(updates.getRemotePreference());
            if (updates.getExperienceYears() != null) user.setExperienceYears(updates.getExperienceYears());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Alert endpoints ───────────────────────────────────────────────────────

    @GetMapping("/api/users/alerts")
    public ResponseEntity<List<UserAlert>> getAlerts(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(alertService.getAlertsByUser(UUID.fromString(userId)));
    }

    @PostMapping("/api/users/alerts")
    public ResponseEntity<UserAlert> createAlert(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody UserAlert alert) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(alertService.createAlert(UUID.fromString(userId), alert));
    }

    @PutMapping("/api/users/alerts/{alertId}")
    public ResponseEntity<UserAlert> updateAlert(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID alertId,
            @RequestBody UserAlert alert) {
        return ResponseEntity.ok(alertService.updateAlert(alertId, UUID.fromString(userId), alert));
    }

    @PatchMapping("/api/users/alerts/{alertId}/toggle")
    public ResponseEntity<Map<String, String>> toggleAlert(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID alertId,
            @RequestParam boolean active) {
        alertService.toggleAlert(alertId, UUID.fromString(userId), active);
        return ResponseEntity.ok(Map.of("status", active ? "enabled" : "disabled"));
    }

    @DeleteMapping("/api/users/alerts/{alertId}")
    public ResponseEntity<Void> deleteAlert(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID alertId) {
        alertService.deleteAlert(alertId, UUID.fromString(userId));
        return ResponseEntity.noContent().build();
    }
}
