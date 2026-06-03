package com.jobpulse.scraper.controller;

import com.jobpulse.scraper.dto.CreateSourceRequest;
import com.jobpulse.scraper.model.CompanySource;
import com.jobpulse.scraper.repository.CompanySourceRepository;
import com.jobpulse.scraper.service.JobScraperService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sources")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SourceController {

    private final CompanySourceRepository sourceRepository;
    private final JobScraperService scraperService;

    @GetMapping
    public ResponseEntity<List<CompanySource>> list() {
        return ResponseEntity.ok(
                sourceRepository.findAll(Sort.by(Sort.Direction.ASC, "companyName")));
    }

    @PostMapping
    public ResponseEntity<CompanySource> create(@RequestBody CreateSourceRequest req) {
        if (req.getCompanyName() == null || req.getCompanyName().isBlank()
                || req.getCareerPageUrl() == null || req.getCareerPageUrl().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        CompanySource source = CompanySource.builder()
                .companyName(req.getCompanyName().trim())
                .careerPageUrl(normalizeUrl(req.getCareerPageUrl().trim()))
                .scrapeStrategy(req.getScrapeStrategy() != null ? req.getScrapeStrategy() : "HTML")
                .scrapeIntervalMinutes(req.getScrapeIntervalMinutes() != null
                        ? req.getScrapeIntervalMinutes() : 15)
                .isActive(true)
                .build();

        return ResponseEntity.ok(sourceRepository.save(source));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<CompanySource> toggle(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean active
    ) {
        return sourceRepository.findById(id)
                .map(source -> {
                    source.setIsActive(active);
                    return ResponseEntity.ok(sourceRepository.save(source));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!sourceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        sourceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/scrape")
    public ResponseEntity<Map<String, String>> scrapeNow(@PathVariable UUID id) {
        return sourceRepository.findById(id)
                .map(source -> {
                    scraperService.scrapeSource(source).subscribe();
                    return ResponseEntity.ok(Map.of(
                            "status", "Scrape started",
                            "company", source.getCompanyName()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private static String normalizeUrl(String url) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        return "https://" + url;
    }
}
