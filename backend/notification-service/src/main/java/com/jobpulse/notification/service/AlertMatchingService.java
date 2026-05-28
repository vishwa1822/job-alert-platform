package com.jobpulse.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertMatchingService {

    private final JdbcTemplate jdbcTemplate;
    private final WebSocketNotificationService wsService;

    /**
     * Core alert matching pipeline.
     * Runs for every new job published to Kafka.
     * Uses PostgreSQL for efficient array-overlap queries.
     *
     * Pipeline:
     * 1. Query alerts that match this job's properties
     * 2. For each matching alert, notify the user in real-time
     * 3. Persist notification record to DB
     */
    public void matchAndNotify(Map<String, Object> jobEvent) {
        String company = (String) jobEvent.get("company");
        String location = (String) jobEvent.get("location");
        String remoteType = (String) jobEvent.get("remoteType");
        String title = (String) jobEvent.get("title");

        // Find all alerts whose criteria match this job
        String sql = """
            SELECT DISTINCT ua.user_id, ua.id as alert_id, ua.name as alert_name
            FROM user_alerts ua
            WHERE ua.is_active = true
            AND (
                ua.keywords IS NULL
                OR EXISTS (
                    SELECT 1 FROM unnest(ua.keywords) k
                    WHERE ? ILIKE '%' || k || '%'
                )
            )
            AND (ua.locations IS NULL OR ? = ANY(ua.locations) OR ua.locations = '{}')
            AND (ua.remote_types IS NULL OR ? = ANY(ua.remote_types) OR ua.remote_types = '{}')
            AND (ua.companies IS NULL OR ? = ANY(ua.companies) OR ua.companies = '{}')
            """;

        try {
            List<Map<String, Object>> matches = jdbcTemplate.queryForList(sql,
                    title, location, remoteType, company);

            log.info("Job '{}' matched {} user alerts", title, matches.size());

            for (Map<String, Object> match : matches) {
                String userId = match.get("user_id").toString();
                String alertId = match.get("alert_id").toString();
                String alertName = (String) match.get("alert_name");

                // Send real-time WebSocket notification
                wsService.sendJobMatchAlert(userId, jobEvent, alertName);

                // Persist notification to DB for notification center
                persistNotification(userId, jobEvent, alertName);

                log.debug("Notified user {} via alert '{}'", userId, alertName);
            }
        } catch (Exception e) {
            log.error("Alert matching failed: {}", e.getMessage());
        }
    }

    private void persistNotification(String userId, Map<String, Object> jobEvent, String alertName) {
        try {
            jdbcTemplate.update("""
                INSERT INTO notifications (user_id, type, title, message, payload, is_read)
                VALUES (CAST(? AS UUID), 'JOB_MATCH', ?, ?, CAST(? AS JSONB), false)
                """,
                    userId,
                    "New job match: " + jobEvent.get("title"),
                    "A new job matching your alert '" + alertName + "' was posted at " + jobEvent.get("company"),
                    "{\"jobId\": \"" + jobEvent.get("jobId") + "\"}"
            );
        } catch (Exception e) {
            log.warn("Failed to persist notification: {}", e.getMessage());
        }
    }
}
