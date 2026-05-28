package com.jobpulse.recommendation.controller;

import com.jobpulse.recommendation.service.RecommendationEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationEngine engine;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getRecommendations(
            @PathVariable String userId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(engine.getRecommendations(userId, limit));
    }

    @DeleteMapping("/user/{userId}/cache")
    public ResponseEntity<Map<String, String>> invalidateCache(@PathVariable String userId) {
        engine.invalidateUserCache(userId);
        return ResponseEntity.ok(Map.of("status", "cache invalidated for " + userId));
    }
}
