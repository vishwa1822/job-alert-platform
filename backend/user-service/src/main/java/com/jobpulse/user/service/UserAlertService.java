package com.jobpulse.user.service;

import com.jobpulse.user.model.UserAlert;
import com.jobpulse.user.repository.UserAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAlertService {

    private final UserAlertRepository alertRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public List<UserAlert> getAlertsByUser(UUID userId) {
        return alertRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public UserAlert createAlert(UUID userId, UserAlert alert) {
        alert.setUserId(userId);
        alert.setIsActive(true);
        UserAlert saved = alertRepository.save(alert);

        // Notify matching pipeline about new alert
        kafkaTemplate.send("user.alert-created", Map.of(
                "userId", userId.toString(),
                "alertId", saved.getId().toString(),
                "alertName", saved.getName()
        ));

        log.info("Created alert '{}' for user {}", alert.getName(), userId);
        return saved;
    }

    @Transactional
    public UserAlert updateAlert(UUID alertId, UUID userId, UserAlert update) {
        UserAlert existing = alertRepository.findByIdAndUserId(alertId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found"));

        existing.setName(update.getName());
        existing.setKeywords(update.getKeywords());
        existing.setLocations(update.getLocations());
        existing.setCompanies(update.getCompanies());
        existing.setJobTypes(update.getJobTypes());
        existing.setRemoteTypes(update.getRemoteTypes());
        existing.setSkills(update.getSkills());
        existing.setSalaryMin(update.getSalaryMin());
        existing.setFrequency(update.getFrequency());
        existing.setNotifyEmail(update.getNotifyEmail());
        existing.setNotifyPush(update.getNotifyPush());

        return alertRepository.save(existing);
    }

    @Transactional
    public void toggleAlert(UUID alertId, UUID userId, boolean active) {
        alertRepository.findByIdAndUserId(alertId, userId).ifPresent(alert -> {
            alert.setIsActive(active);
            alertRepository.save(alert);
        });
    }

    @Transactional
    public void deleteAlert(UUID alertId, UUID userId) {
        alertRepository.findByIdAndUserId(alertId, userId).ifPresent(alertRepository::delete);
        log.info("Deleted alert {} for user {}", alertId, userId);
    }
}
