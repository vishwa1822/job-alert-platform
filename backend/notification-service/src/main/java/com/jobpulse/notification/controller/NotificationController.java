package com.jobpulse.notification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final JdbcTemplate jdbcTemplate;

    /** Paginated notification list for the notification centre panel */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {

        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
            SELECT id, type, title, message, payload, is_read, created_at
            FROM notifications
            WHERE user_id = CAST(? AS UUID)
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """, userId, size, page * size);

        return ResponseEntity.ok(rows);
    }

    /** Unread count badge */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestHeader("X-User-Id") String userId) {
        Long count = jdbcTemplate.queryForObject("""
            SELECT COUNT(*) FROM notifications
            WHERE user_id = CAST(? AS UUID) AND is_read = false
            """, Long.class, userId);
        return ResponseEntity.ok(Map.of("count", count == null ? 0L : count));
    }

    /** Mark a single notification as read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String id) {
        jdbcTemplate.update("""
            UPDATE notifications SET is_read = true
            WHERE id = CAST(? AS UUID) AND user_id = CAST(? AS UUID)
            """, id, userId);
        return ResponseEntity.noContent().build();
    }

    /** Mark all notifications as read */
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(
            @RequestHeader("X-User-Id") String userId) {
        int updated = jdbcTemplate.update("""
            UPDATE notifications SET is_read = true
            WHERE user_id = CAST(? AS UUID) AND is_read = false
            """, userId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    /** Delete a notification */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String id) {
        jdbcTemplate.update("""
            DELETE FROM notifications
            WHERE id = CAST(? AS UUID) AND user_id = CAST(? AS UUID)
            """, id, userId);
        return ResponseEntity.noContent().build();
    }

    /** WebSocket health / stats */
    @GetMapping("/ws/stats")
    public ResponseEntity<Map<String, Object>> wsStats() {
        return ResponseEntity.ok(Map.of(
            "status", "running",
            "endpoint", "/ws/notifications?userId=<UUID>"
        ));
    }
}
