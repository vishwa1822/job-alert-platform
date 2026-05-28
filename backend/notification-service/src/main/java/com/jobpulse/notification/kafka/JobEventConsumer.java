package com.jobpulse.notification.kafka;

import com.jobpulse.notification.service.AlertMatchingService;
import com.jobpulse.notification.service.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobEventConsumer {

    private final AlertMatchingService alertMatchingService;
    private final WebSocketNotificationService wsService;

    /**
     * Consumes new job events from Kafka.
     * Matches against all active user alerts and triggers real-time WebSocket notifications.
     * This is the core of the real-time notification pipeline.
     */
    @KafkaListener(
            topics = "${kafka.topics.new-jobs:job.new-postings}",
            groupId = "notification-service",
            concurrency = "3"
    )
    public void handleNewJob(Map<String, Object> jobEvent) {
        String jobId = (String) jobEvent.get("jobId");
        String title = (String) jobEvent.get("title");
        String company = (String) jobEvent.get("company");

        log.info("Processing new job event: {} @ {} (id: {})", title, company, jobId);

        // Match against all active user alerts and send targeted notifications
        alertMatchingService.matchAndNotify(jobEvent);

        // Broadcast to the global "live feed" for users browsing the platform
        wsService.broadcast(Map.of(
                "type", "LIVE_JOB_FEED",
                "jobId", jobId,
                "title", title,
                "company", company,
                "location", jobEvent.getOrDefault("location", ""),
                "remoteType", jobEvent.getOrDefault("remoteType", ""),
                "postedAt", jobEvent.getOrDefault("postedAt", ""),
                "timestamp", System.currentTimeMillis()
        ));
    }

    @KafkaListener(
            topics = "${kafka.topics.job-updates:job.updates}",
            groupId = "notification-service"
    )
    public void handleJobUpdate(Map<String, Object> jobEvent) {
        String eventType = (String) jobEvent.get("eventType");
        if ("JOB_EXPIRED".equals(eventType)) {
            log.info("Job expired: {}", jobEvent.get("jobId"));
        }
    }
}
