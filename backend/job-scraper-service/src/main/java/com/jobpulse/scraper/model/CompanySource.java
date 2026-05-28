package com.jobpulse.scraper.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "company_sources")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CompanySource {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "company_name", nullable = false) private String companyName;
    @Column(name = "career_page_url", nullable = false) private String careerPageUrl;
    @Column(name = "api_endpoint") private String apiEndpoint;
    @Column(name = "scrape_interval_minutes") private Integer scrapeIntervalMinutes;
    @Column(name = "last_scraped_at") private OffsetDateTime lastScrapedAt;
    @Column(name = "is_active") private Boolean isActive;
    @Column(name = "scrape_strategy") private String scrapeStrategy;
}
