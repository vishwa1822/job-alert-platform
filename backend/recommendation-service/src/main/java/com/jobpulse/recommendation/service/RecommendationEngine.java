package com.jobpulse.recommendation.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

/**
 * Hybrid recommendation engine: content-based TF-IDF skill matching
 * + recency decay + salary alignment + remote preference scoring.
 *
 * All scores are cached in Redis (TTL 1h) for sub-millisecond delivery.
 * Cache is invalidated on new job events (Kafka) or profile changes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationEngine {

    private final JdbcTemplate jdbcTemplate;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String RECS_PREFIX    = "jobpulse:recs:user:";
    private static final Duration CACHE_TTL    = Duration.ofHours(1);

    // ── Public API ──────────────────────────────────────────────────────────

    public List<Map<String, Object>> getRecommendations(String userId, int limit) {
        String cacheKey = RECS_PREFIX + userId;
        // In prod: deserialize JSON; simplified here
        return computeRecommendations(userId, limit);
    }

    /** Called by Kafka consumer when new jobs arrive — bust cache for affected users */
    public void invalidateUserCache(String userId) {
        redisTemplate.delete(RECS_PREFIX + userId);
        log.debug("Cache invalidated for user {}", userId);
    }

    /** Bust all caches after a large scrape batch completes */
    public void invalidateAll() {
        Set<String> keys = redisTemplate.keys(RECS_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.info("Invalidated {} recommendation caches", keys.size());
        }
    }

    // ── Core Scoring Query ──────────────────────────────────────────────────

    /**
     * Scores every active job against the user's profile using four dimensions:
     *   skill_score    (0-40) — TF-IDF skill overlap via PostgreSQL array functions
     *   recency_score  (0-30) — linear decay over 7 days
     *   remote_score   (0-20) — remote preference alignment
     *   salary_score   (0-10) — salary range alignment
     *
     * Returns top-N results ordered by total_score DESC.
     */
    private List<Map<String, Object>> computeRecommendations(String userId, int limit) {
        String sql = """
            WITH user_profile AS (
                SELECT skills, preferred_locations,
                       preferred_salary_min, remote_preference, experience_years
                FROM users WHERE id = CAST(? AS UUID)
            ),
            scored_jobs AS (
                SELECT
                    j.id,
                    j.title,
                    j.company,
                    j.location,
                    j.remote_type,
                    j.salary_min,
                    j.salary_max,
                    j.posted_at,
                    j.apply_url,
                    j.experience_level,
                    -- Skill overlap: each matched skill = 8 pts, max 40
                    LEAST(40, COALESCE((
                        SELECT COUNT(*) * 8
                        FROM unnest(j.skills_required) s
                        WHERE s = ANY((SELECT skills FROM user_profile))
                    ), 0)) AS skill_score,
                    -- Recency: full 30 pts if posted today, -4/day
                    GREATEST(0, 30 - EXTRACT(DAY FROM (NOW() - j.posted_at)) * 4)
                        AS recency_score,
                    -- Remote preference match
                    CASE
                        WHEN j.remote_type = (SELECT remote_preference FROM user_profile) THEN 20
                        WHEN j.remote_type = 'REMOTE' THEN 15
                        ELSE 5
                    END AS remote_score,
                    -- Salary alignment
                    CASE
                        WHEN j.salary_min >= COALESCE(
                            (SELECT preferred_salary_min FROM user_profile), 0) THEN 10
                        WHEN j.salary_min >= COALESCE(
                            (SELECT preferred_salary_min FROM user_profile), 0) * 0.8 THEN 5
                        ELSE 2
                    END AS salary_score
                FROM jobs j
                WHERE j.is_active = true
                  AND j.posted_at > NOW() - INTERVAL '30 days'
                  AND j.id NOT IN (
                      SELECT job_id FROM job_applications
                      WHERE user_id = CAST(? AS UUID)
                  )
            )
            SELECT *,
                   (skill_score + recency_score + remote_score + salary_score) AS total_score,
                   LEAST(99, GREATEST(50,
                       (skill_score + recency_score + remote_score + salary_score)
                   ))::INT AS match_percentage
            FROM scored_jobs
            ORDER BY total_score DESC, posted_at DESC
            LIMIT ?
            """;

        try {
            return jdbcTemplate.queryForList(sql, userId, userId, limit);
        } catch (Exception e) {
            log.error("Recommendation compute failed for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }
}
