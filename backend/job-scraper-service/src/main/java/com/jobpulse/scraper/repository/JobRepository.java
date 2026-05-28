package com.jobpulse.scraper.repository;

import com.jobpulse.scraper.model.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    Optional<Job> findByExternalIdAndSourceId(String externalId, UUID sourceId);

    Page<Job> findByIsActiveTrueOrderByPostedAtDesc(Pageable pageable);

    @Query(value = """
        SELECT * FROM jobs
        WHERE is_active = true
          AND (:company IS NULL OR LOWER(company) LIKE LOWER(CONCAT('%', :company, '%')))
          AND (:location IS NULL OR LOWER(location) LIKE LOWER(CONCAT('%', :location, '%')))
          AND (:remoteType IS NULL OR remote_type = :remoteType)
          AND (:minSalary IS NULL OR salary_min >= :minSalary)
        ORDER BY posted_at DESC
        """, nativeQuery = true)
    Page<Job> searchJobs(String company, String location, String remoteType,
                          Long minSalary, Pageable pageable);

    @Query(value = """
        SELECT * FROM jobs
        WHERE is_active = true
          AND search_vector @@ plainto_tsquery('english', :query)
        ORDER BY ts_rank(search_vector, plainto_tsquery('english', :query)) DESC,
                 posted_at DESC
        """, nativeQuery = true)
    Page<Job> fullTextSearch(String query, Pageable pageable);

    List<Job> findByIsActiveTrueAndPostedAtAfter(OffsetDateTime since);

    long countByIsActiveTrueAndPostedAtAfter(OffsetDateTime since);
}
