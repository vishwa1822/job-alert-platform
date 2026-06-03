package com.jobpulse.scraper.controller;

import com.jobpulse.scraper.model.CompanySource;
import com.jobpulse.scraper.model.Job;
import com.jobpulse.scraper.repository.CompanySourceRepository;
import com.jobpulse.scraper.repository.JobRepository;
import com.jobpulse.scraper.service.JobScraperService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobController {

    private final JobRepository jobRepository;
    private final CompanySourceRepository sourceRepository;
    private final JobScraperService scraperService;

    @GetMapping
    public ResponseEntity<Page<Job>> listJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String remoteType,
            @RequestParam(required = false) Long minSalary
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("postedAt").descending());

        Page<Job> jobs;
        if (search != null && !search.isBlank()) {
            jobs = jobRepository.fullTextSearch(search, pageable);
        } else {
            jobs = jobRepository.searchJobs(company, location, remoteType, minSalary, pageable);
        }
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Job>> getRecentJobs(
            @RequestParam(defaultValue = "24") int hoursBack
    ) {
        OffsetDateTime since = OffsetDateTime.now().minusHours(hoursBack);
        List<Job> jobs = jobRepository.findByIsActiveTrueAndPostedAtAfter(since);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalJobs = jobRepository.count();
        long todayJobs = jobRepository.countByIsActiveTrueAndPostedAtAfter(
                OffsetDateTime.now().minusDays(1));
        long activeJobs = jobRepository.countByIsActiveTrueAndPostedAtAfter(
                OffsetDateTime.now().minusDays(30));
        long sourcesActive = sourceRepository.findByIsActiveTrue().size();

        return ResponseEntity.ok(Map.of(
                "totalJobs", totalJobs,
                "jobsToday", todayJobs,
                "activeListings", activeJobs,
                "sourcesMonitored", sourcesActive
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJob(@PathVariable UUID id) {
        return jobRepository.findById(id)
                .map(job -> {
                    job.setViewCount(job.getViewCount() + 1);
                    jobRepository.save(job);
                    return ResponseEntity.ok(job);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/scrape/trigger")
    public ResponseEntity<Map<String, String>> triggerScrape(
            @RequestParam(required = false) UUID sourceId
    ) {
        if (sourceId != null) {
            sourceRepository.findById(sourceId).ifPresent(source ->
                    scraperService.scrapeSource(source).subscribe());
            return ResponseEntity.ok(Map.of("status", "Scraping source " + sourceId));
        }

        scraperService.scrapeAllSources().subscribe();
        return ResponseEntity.ok(Map.of("status", "Full scraping cycle triggered"));
    }
}

