package com.jobpulse.scraper.repository;

import com.jobpulse.scraper.model.CompanySource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CompanySourceRepository extends JpaRepository<CompanySource, UUID> {
    List<CompanySource> findByIsActiveTrue();
}
