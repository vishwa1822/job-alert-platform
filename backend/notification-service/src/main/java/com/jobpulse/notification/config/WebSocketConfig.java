package com.jobpulse.notification.config;

import com.jobpulse.notification.service.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.*;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;

@Slf4j
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebSocketNotificationService wsService;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new JobPulseWebSocketHandler(wsService), "/ws/notifications")
                .setAllowedOrigins("*");
    }

    /**
     * WebSocket handler that maps each session to a userId extracted from
     * the JWT query param: ws://host/ws/notifications?userId=<UUID>
     *
     * In production the gateway validates the JWT before proxying, so userId
     * is trusted here.
     */
    static class JobPulseWebSocketHandler extends TextWebSocketHandler {

        private final WebSocketNotificationService wsService;

        JobPulseWebSocketHandler(WebSocketNotificationService wsService) {
            this.wsService = wsService;
        }

        @Override
        public void afterConnectionEstablished(WebSocketSession session) {
            String userId = extractUserId(session);
            if (userId != null) {
                wsService.registerSession(userId, session);
                log.info("WebSocket connected: user={} session={}", userId, session.getId());
            } else {
                log.warn("WebSocket connected without userId, closing: {}", session.getId());
                try { session.close(CloseStatus.POLICY_VIOLATION); } catch (Exception ignored) {}
            }
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
            wsService.removeSession(session);
        }

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) {
            // Client heartbeat / ping — echo back
            try { session.sendMessage(new TextMessage("{\"type\":\"PONG\"}")); }
            catch (Exception ignored) {}
        }

        @Override
        public void handleTransportError(WebSocketSession session, Throwable ex) {
            log.error("WebSocket error on session {}: {}", session.getId(), ex.getMessage());
            wsService.removeSession(session);
        }

        private String extractUserId(WebSocketSession session) {
            URI uri = session.getUri();
            if (uri == null) return null;
            String query = uri.getQuery();
            if (query == null) return null;
            for (String part : query.split("&")) {
                if (part.startsWith("userId=")) return part.substring(7);
            }
            return null;
        }
    }
}
