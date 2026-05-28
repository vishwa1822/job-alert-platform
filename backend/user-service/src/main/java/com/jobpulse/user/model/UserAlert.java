package com.jobpulse.user.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_alerts")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "text[]")
    private List<String> keywords;

    @Column(columnDefinition = "text[]")
    private List<String> locations;

    @Column(columnDefinition = "text[]")
    private List<String> companies;

    @Column(name = "job_types", columnDefinition = "text[]")
    private List<String> jobTypes;

    @Column(name = "remote_types", columnDefinition = "text[]")
    private List<String> remoteTypes;

    @Column(columnDefinition = "text[]")
    private List<String> skills;

    @Column(name = "salary_min")
    private Long salaryMin;

    @Column(name = "notify_email")
    private Boolean notifyEmail;

    @Column(name = "notify_push")
    private Boolean notifyPush;

    private String frequency;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = OffsetDateTime.now();
        if (isActive == null) isActive = true;
        if (notifyEmail == null) notifyEmail = true;
        if (notifyPush == null) notifyPush = true;
        if (frequency == null) frequency = "INSTANT";
    }
}
