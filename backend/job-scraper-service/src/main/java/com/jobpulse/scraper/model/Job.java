package com.jobpulse.scraper.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Job {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "external_id") private String externalId;
    @Column(name = "source_id")   private UUID sourceId;
    @Column(nullable = false)     private String title;
    @Column(nullable = false)     private String company;
    @Column(name = "company_logo") private String companyLogo;
    private String location;
    @Column(name = "remote_type") private String remoteType;
    @Column(name = "salary_min")  private Long salaryMin;
    @Column(name = "salary_max")  private Long salaryMax;
    @Column(name = "salary_currency") private String salaryCurrency;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(columnDefinition = "TEXT") private String requirements;
    @Column(name = "job_type")    private String jobType;
    @Column(name = "experience_level") private String experienceLevel;
    @Column(name = "skills_required", columnDefinition = "text[]")
    private List<String> skillsRequired;
    @Column(name = "apply_url", nullable = false) private String applyUrl;
    @Column(name = "is_active")   private Boolean isActive;
    @Column(name = "posted_at")   private OffsetDateTime postedAt;
    @Column(name = "scraped_at")  private OffsetDateTime scrapedAt;
    @Column(name = "view_count")  private Integer viewCount;
    @Column(name = "apply_count") private Integer applyCount;

    @PrePersist public void prePersist() {
        if (scrapedAt == null) scrapedAt = OffsetDateTime.now();
        if (postedAt  == null) postedAt  = OffsetDateTime.now();
        if (isActive  == null) isActive  = true;
        if (viewCount == null) viewCount = 0;
        if (applyCount== null) applyCount= 0;
        if (salaryCurrency == null) salaryCurrency = "USD";
    }
}
