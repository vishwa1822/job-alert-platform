package com.jobpulse.scraper.kafka;

import com.jobpulse.scraper.dto.JobEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobEventProducer {

    private final KafkaTemplate<String, JobEvent> kafkaTemplate;

    @Value("${kafka.topics.new-jobs:job.new-postings}")
    private String newJobsTopic;

    @Value("${kafka.topics.job-updates:job.updates}")
    private String jobUpdatesTopic;

    /**
     * Publishes a new job event to Kafka.
     * The notification and recommendation services consume this topic
     * to trigger real-time alerts and update recommendation models.
     */
    public void publishNewJob(JobEvent event) {
        CompletableFuture<SendResult<String, JobEvent>> future =
                kafkaTemplate.send(newJobsTopic, event.getJobId(), event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.debug("Published job event: {} to partition {}",
                        event.getJobId(),
                        result.getRecordMetadata().partition());
            } else {
                log.error("Failed to publish job event {}: {}", event.getJobId(), ex.getMessage());
            }
        });
    }

    public void publishJobUpdate(JobEvent event) {
        event.setEventType("JOB_UPDATED");
        kafkaTemplate.send(jobUpdatesTopic, event.getJobId(), event);
    }

    public void publishJobExpired(String jobId) {
        JobEvent event = JobEvent.builder()
                .jobId(jobId)
                .eventType("JOB_EXPIRED")
                .build();
        kafkaTemplate.send(jobUpdatesTopic, jobId, event);
    }
}
