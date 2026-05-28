package com.jobpulse.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, String> redisTemplate;

    // Map: userId → Set of WebSocket sessions (user can be connected from multiple tabs)
    private final Map<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    // Map: sessionId → userId (for cleanup on disconnect)
    private final Map<String, String> sessionToUser = new ConcurrentHashMap<>();

    public void registerSession(String userId, WebSocketSession session) {
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                    .add(session);
        sessionToUser.put(session.getId(), userId);
        log.info("User {} connected via WebSocket. Total sessions: {}", userId,
                userSessions.get(userId).size());

        // Send any pending notifications from Redis
        deliverPendingNotifications(userId, session);
    }

    public void removeSession(WebSocketSession session) {
        String userId = sessionToUser.remove(session.getId());
        if (userId != null) {
            Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
            log.info("User {} disconnected. Remaining sessions: {}",
                    userId, userSessions.getOrDefault(userId, Set.of()).size());
        }
    }

    /**
     * Sends a real-time notification to a specific user.
     * If the user is offline, the notification is stored in Redis for delivery when they reconnect.
     */
    public void sendToUser(String userId, Map<String, Object> notification) {
        Set<WebSocketSession> sessions = userSessions.get(userId);

        if (sessions == null || sessions.isEmpty()) {
            // User offline: store in Redis queue (TTL: 7 days)
            storePendingNotification(userId, notification);
            log.debug("User {} offline, notification queued", userId);
            return;
        }

        String message = serializeNotification(notification);
        Set<WebSocketSession> deadSessions = new HashSet<>();

        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(new TextMessage(message));
                    }
                    log.debug("Delivered notification to user {} session {}", userId, session.getId());
                } catch (IOException e) {
                    log.error("Failed to send to session {}: {}", session.getId(), e.getMessage());
                    deadSessions.add(session);
                }
            } else {
                deadSessions.add(session);
            }
        }

        // Cleanup dead sessions
        deadSessions.forEach(this::removeSession);
    }

    /**
     * Broadcasts a notification to ALL connected users (e.g., system announcements).
     */
    public void broadcast(Map<String, Object> notification) {
        String message = serializeNotification(notification);
        userSessions.values().stream()
                .flatMap(Collection::stream)
                .filter(WebSocketSession::isOpen)
                .forEach(session -> {
                    try {
                        synchronized (session) {
                            session.sendMessage(new TextMessage(message));
                        }
                    } catch (IOException e) {
                        log.warn("Broadcast failed for session {}", session.getId());
                    }
                });
    }

    /**
     * Sends job match alerts to matching users based on their alert preferences.
     */
    public void sendJobMatchAlert(String userId, Map<String, Object> jobData, String alertName) {
        Map<String, Object> notification = new LinkedHashMap<>();
        notification.put("type", "JOB_MATCH");
        notification.put("alertName", alertName);
        notification.put("message", "New match for your alert: " + alertName);
        notification.put("job", jobData);
        notification.put("timestamp", System.currentTimeMillis());
        sendToUser(userId, notification);
    }

    public int getConnectedUsersCount() {
        return userSessions.size();
    }

    public int getTotalSessionsCount() {
        return userSessions.values().stream().mapToInt(Set::size).sum();
    }

    private void storePendingNotification(String userId, Map<String, Object> notification) {
        String key = "jobpulse:pending-notifications:" + userId;
        redisTemplate.opsForList().rightPush(key, serializeNotification(notification));
        redisTemplate.expire(key, java.time.Duration.ofDays(7));
    }

    private void deliverPendingNotifications(String userId, WebSocketSession session) {
        String key = "jobpulse:pending-notifications:" + userId;
        List<String> pending = redisTemplate.opsForList().range(key, 0, -1);
        if (pending == null || pending.isEmpty()) return;

        log.info("Delivering {} pending notifications to user {}", pending.size(), userId);
        for (String msg : pending) {
            try {
                session.sendMessage(new TextMessage(msg));
            } catch (IOException e) {
                log.warn("Failed to deliver pending notification: {}", e.getMessage());
                break;
            }
        }
        redisTemplate.delete(key);
    }

    private String serializeNotification(Map<String, Object> notification) {
        try {
            return objectMapper.writeValueAsString(notification);
        } catch (Exception e) {
            return "{\"error\": \"serialization_failed\"}";
        }
    }
}
