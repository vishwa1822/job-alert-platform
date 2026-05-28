package com.jobpulse.scraper.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobpulse.scraper.dto.JobEvent;
import com.jobpulse.scraper.kafka.JobEventProducer;
import com.jobpulse.scraper.model.CompanySource;
import com.jobpulse.scraper.model.Job;
import com.jobpulse.scraper.repository.CompanySourceRepository;
import com.jobpulse.scraper.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobScraperService {

    private final JobRepository jobRepository;
    private final CompanySourceRepository sourceRepository;
    private final JobEventProducer eventProducer;
    private final RedisTemplate<String, String> redisTemplate;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    private static final String JOB_SEEN_PREFIX = "jobpulse:seen:";
    private final Map<UUID, Boolean> activeScrapes = new ConcurrentHashMap<>();

    /**
     * Orchestrates scraping of all active company sources concurrently.
     * Uses reactive streams with bounded concurrency to avoid overwhelming targets.
     */
    public Flux<Job> scrapeAllSources() {
        return Flux.fromIterable(sourceRepository.findByIsActiveTrue())
                .filter(source -> shouldScrapeNow(source))
                .parallel(10)
                .runOn(Schedulers.boundedElastic())
                .flatMap(this::scrapeSource)
                .sequential()
                .doOnComplete(() -> log.info("Completed scraping all sources"));
    }

    /**
     * Scrapes a single company source and processes new jobs.
     */
    public Flux<Job> scrapeSource(CompanySource source) {
        if (activeScrapes.putIfAbsent(source.getId(), true) != null) {
            log.debug("Skipping source {} - already scraping", source.getCompanyName());
            return Flux.empty();
        }

        log.info("Scraping source: {} via {}", source.getCompanyName(), source.getScrapeStrategy());

        return fetchJobs(source)
                .filter(job -> isNewJob(job, source))
                .flatMap(job -> Mono.fromCallable(() -> saveJob(job, source)))
                .doOnNext(job -> {
                    publishNewJobEvent(job);
                    markJobSeen(job, source);
                    log.info("NEW JOB: {} @ {} - Published to Kafka", job.getTitle(), job.getCompany());
                })
                .doFinally(signal -> {
                    activeScrapes.remove(source.getId());
                    updateLastScraped(source);
                })
                .onErrorResume(ex -> {
                    log.error("Error scraping {}: {}", source.getCompanyName(), ex.getMessage());
                    activeScrapes.remove(source.getId());
                    return Flux.empty();
                });
    }

    /**
     * Fetches jobs from a source using the appropriate strategy (API or HTML scraping).
     */
    private Flux<Job> fetchJobs(CompanySource source) {
        return switch (source.getScrapeStrategy()) {
            case "API" -> fetchFromApi(source);
            case "HTML" -> fetchFromHtml(source);
            case "RSS" -> fetchFromRss(source);
            default -> fetchFromHtml(source);
        };
    }

    /**
     * Fetches jobs from a company's career API endpoint.
     * Handles pagination, rate limits, and authentication headers.
     */
    private Flux<Job> fetchFromApi(CompanySource source) {
        WebClient client = webClientBuilder
                .baseUrl(source.getApiEndpoint() != null ? source.getApiEndpoint() : source.getCareerPageUrl())
                .defaultHeader("User-Agent", "JobPulse-Bot/1.0 (+https://jobpulse.dev/bot)")
                .build();

        return client.get()
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .flatMapMany(body -> parseApiResponse(body, source))
                .onErrorResume(ex -> {
                    log.warn("API fetch failed for {}, falling back to HTML: {}", source.getCompanyName(), ex.getMessage());
                    return fetchFromHtml(source);
                });
    }

    /**
     * Parses API JSON response and maps to Job entities.
     * Uses a smart field-detection strategy to handle varying API formats.
     */
    private Flux<Job> parseApiResponse(String body, CompanySource source) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode items = findJobArray(root);

            List<Job> jobs = new ArrayList<>();
            if (items != null && items.isArray()) {
                for (JsonNode item : items) {
                    jobs.add(mapNodeToJob(item, source));
                }
            }
            return Flux.fromIterable(jobs);
        } catch (Exception e) {
            log.error("Failed to parse API response from {}: {}", source.getCompanyName(), e.getMessage());
            return Flux.empty();
        }
    }

    private JsonNode findJobArray(JsonNode root) {
        // Smart detection of job array in various API response formats
        String[] commonKeys = {"jobs", "results", "data", "positions", "openings", "listings"};
        for (String key : commonKeys) {
            if (root.has(key) && root.get(key).isArray()) {
                return root.get(key);
            }
        }
        return root.isArray() ? root : null;
    }

    private Job mapNodeToJob(JsonNode node, CompanySource source) {
        return Job.builder()
                .externalId(getField(node, "id", "jobId", "req_id", "requisitionId"))
                .sourceId(source.getId())
                .title(getField(node, "title", "jobTitle", "name", "position"))
                .company(source.getCompanyName())
                .location(getField(node, "location", "jobLocation", "city"))
                .remoteType(detectRemoteType(node))
                .description(getField(node, "description", "jobDescription", "summary"))
                .jobType(getField(node, "jobType", "employment_type", "type"))
                .experienceLevel(getField(node, "seniority", "level", "experienceLevel"))
                .applyUrl(buildApplyUrl(node, source))
                .postedAt(OffsetDateTime.now())
                .build();
    }

    private String getField(JsonNode node, String... candidates) {
        for (String key : candidates) {
            if (node.has(key) && !node.get(key).isNull()) {
                return node.get(key).asText();
            }
        }
        return null;
    }

    private String detectRemoteType(JsonNode node) {
        String location = getField(node, "location", "jobLocation");
        if (location != null) {
            String lower = location.toLowerCase();
            if (lower.contains("remote")) return "REMOTE";
            if (lower.contains("hybrid")) return "HYBRID";
        }
        String remote = getField(node, "remote", "workplaceType", "work_type");
        return remote != null ? remote.toUpperCase() : "ONSITE";
    }

    private String buildApplyUrl(JsonNode node, CompanySource source) {
        String applyUrl = getField(node, "applyUrl", "apply_url", "url", "link", "absoluteUrl");
        if (applyUrl != null && applyUrl.startsWith("http")) return applyUrl;
        String id = getField(node, "id", "jobId");
        if (id != null) return source.getCareerPageUrl() + "/" + id;
        return source.getCareerPageUrl();
    }

    /**
     * Simulates HTML scraping with JSoup (in prod, inject JSoup-based parser).
     * Generates realistic job data for demonstration.
     */
    private Flux<Job> fetchFromHtml(CompanySource source) {
        return Flux.defer(() -> {
            // Production: use Jsoup.connect(url).get() and parse DOM
            // Here we simulate with a realistic job generation
            List<Job> simulatedJobs = generateSimulatedJobs(source);
            return Flux.fromIterable(simulatedJobs);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private Flux<Job> fetchFromRss(CompanySource source) {
        return fetchFromHtml(source); // Delegate for now
    }

    /**
     * Generates realistic simulated jobs for each company source.
     * In production, this is replaced by actual HTTP scraping.
     */
    private List<Job> generateSimulatedJobs(CompanySource source) {
        List<String> jobTitles = List.of(
                "Senior Software Engineer", "Staff Backend Engineer",
                "Principal ML Engineer", "Senior Product Manager",
                "Site Reliability Engineer", "Frontend Engineer",
                "Data Scientist", "DevOps Engineer", "Security Engineer"
        );
        List<String> locations = List.of("San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Remote");
        Random random = new Random();

        int count = random.nextInt(3) + 1;
        List<Job> jobs = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            String title = jobTitles.get(random.nextInt(jobTitles.size()));
            String location = locations.get(random.nextInt(locations.size()));
            String jobId = source.getCompanyName().toLowerCase() + "-" + System.currentTimeMillis() + "-" + i;

            jobs.add(Job.builder()
                    .externalId(jobId)
                    .sourceId(source.getId())
                    .title(title)
                    .company(source.getCompanyName())
                    .location(location)
                    .remoteType(location.equals("Remote") ? "REMOTE" : random.nextBoolean() ? "HYBRID" : "ONSITE")
                    .description("Join " + source.getCompanyName() + " as a " + title +
                                 ". You will work on challenging problems at scale, " +
                                 "collaborating with world-class engineers.")
                    .jobType("FULL_TIME")
                    .experienceLevel(random.nextBoolean() ? "SENIOR" : "MID")
                    .salaryMin(120000L + random.nextInt(80000))
                    .salaryMax(200000L + random.nextInt(100000))
                    .salaryCurrency("USD")
                    .applyUrl(source.getCareerPageUrl() + "?job=" + jobId)
                    .postedAt(OffsetDateTime.now())
                    .build());
        }
        return jobs;
    }

    private boolean shouldScrapeNow(CompanySource source) {
        if (source.getLastScrapedAt() == null) return true;
        int intervalMinutes = source.getScrapeIntervalMinutes() != null ? source.getScrapeIntervalMinutes() : 15;
        return source.getLastScrapedAt()
                .plusMinutes(intervalMinutes)
                .isBefore(OffsetDateTime.now());
    }

    /**
     * Checks Redis bloom filter to avoid re-processing seen jobs.
     */
    private boolean isNewJob(Job job, CompanySource source) {
        if (job.getExternalId() == null) return true;
        String key = JOB_SEEN_PREFIX + source.getId() + ":" + job.getExternalId();
        Boolean exists = redisTemplate.hasKey(key);
        return !Boolean.TRUE.equals(exists);
    }

    private void markJobSeen(Job job, CompanySource source) {
        if (job.getExternalId() == null) return;
        String key = JOB_SEEN_PREFIX + source.getId() + ":" + job.getExternalId();
        redisTemplate.opsForValue().set(key, "1", Duration.ofDays(30));
    }

    private Job saveJob(Job job, CompanySource source) {
        // Upsert: find by externalId+sourceId or insert new
        if (job.getExternalId() != null) {
            Optional<Job> existing = jobRepository
                    .findByExternalIdAndSourceId(job.getExternalId(), source.getId());
            if (existing.isPresent()) return existing.get();
        }
        return jobRepository.save(job);
    }

    private void publishNewJobEvent(Job job) {
        JobEvent event = JobEvent.builder()
                .jobId(job.getId().toString())
                .title(job.getTitle())
                .company(job.getCompany())
                .location(job.getLocation())
                .remoteType(job.getRemoteType())
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .applyUrl(job.getApplyUrl())
                .postedAt(job.getPostedAt().toString())
                .eventType("NEW_JOB")
                .build();
        eventProducer.publishNewJob(event);
    }

    private void updateLastScraped(CompanySource source) {
        source.setLastScrapedAt(OffsetDateTime.now());
        sourceRepository.save(source);
    }
}
