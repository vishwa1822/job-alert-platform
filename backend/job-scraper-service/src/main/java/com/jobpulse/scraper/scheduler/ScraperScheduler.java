package com.jobpulse.scraper.scheduler;

import com.jobpulse.scraper.service.JobScraperService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScraperScheduler {

    private final JobScraperService scraperService;

    /**
     * Main scraping cycle – runs every 5 minutes.
     * Each source is scraped at its own interval; this is the orchestrator heartbeat.
     */
    @Scheduled(fixedDelayString = "${scraper.interval-ms:300000}")
    public void runScrapingCycle() {
        log.info("=== Scraping cycle started at {} ===", Instant.now());

        scraperService.scrapeAllSources()
                .subscribe(
                        job -> log.debug("Processed job: {}", job.getId()),
                        error -> log.error("Scraping cycle error: {}", error.getMessage()),
                        () -> log.info("=== Scraping cycle complete ===")
                );
    }

    /**
     * High-frequency scan for priority sources (top tech companies).
     * Runs every 2 minutes for sources with interval <= 10 minutes.
     */
    @Scheduled(fixedDelay = 120000)
    public void runPriorityScrapingCycle() {
        log.debug("Priority scraping cycle triggered");
        scraperService.scrapeAllSources()
                .filter(job -> job != null)
                .take(50) // limit to 50 jobs per priority cycle
                .subscribe(
                        job -> {},
                        error -> log.warn("Priority scrape error: {}", error.getMessage())
                );
    }
}
