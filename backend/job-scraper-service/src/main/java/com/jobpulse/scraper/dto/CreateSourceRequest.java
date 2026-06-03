package com.jobpulse.scraper.dto;

import lombok.Data;

@Data
public class CreateSourceRequest {
    private String companyName;
    private String careerPageUrl;
    private String scrapeStrategy;
    private Integer scrapeIntervalMinutes;
}
