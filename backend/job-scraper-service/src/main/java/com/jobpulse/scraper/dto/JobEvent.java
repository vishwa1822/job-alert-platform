package com.jobpulse.scraper.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobEvent {
    private String jobId;
    private String title;
    private String company;
    private String location;
    private String remoteType;
    private Long salaryMin;
    private Long salaryMax;
    private String applyUrl;
    private String postedAt;
    private String eventType;
    private String experienceLevel;
    private String jobType;
}
