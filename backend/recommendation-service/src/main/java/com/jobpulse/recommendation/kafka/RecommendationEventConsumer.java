package com.jobpulse.recommendation.kafka;

import com.jobpulse.recommendation.service.RecommendationEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecommendationEventConsumer {

    private final RecommendationEngine engine;

    /**
     * Every new job posted → invalidate all recommendation caches.
     * This ensures users always see the freshest recommendations.
     * Runs async in its own Kafka consumer thread.
     */
    @KafkaListener(
        topics = "${kafka.topics.new-jobs:job.new-postings}",
        groupId = "recommendation-service"
    )
    public void onNewJob(Map<String, Object> event) {
        log.debug("New job event received, invalidating recommendation caches");
        engine.invalidateAll();
    }
}
