package com.jobpulse.user.dto;
import lombok.*;
import java.util.List;
@Data @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;
    private String fullName;
    private List<String> skills;
    private List<String> preferredRoles;
    private List<String> preferredLocations;
    private Long preferredSalaryMin;
    private String remotePreference;
    private Integer experienceYears;
}
