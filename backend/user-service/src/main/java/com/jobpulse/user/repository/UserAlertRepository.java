package com.jobpulse.user.repository;
import com.jobpulse.user.model.UserAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface UserAlertRepository extends JpaRepository<UserAlert, UUID> {
    List<UserAlert> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<UserAlert> findByIdAndUserId(UUID id, UUID userId);
}
