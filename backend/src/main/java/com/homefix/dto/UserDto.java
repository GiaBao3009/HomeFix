package com.homefix.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String role;
    private String avatarUrl;
    private String specialty;
    private Integer experienceYears;
    private String workDescription;
    private String citizenId;
    private boolean technicianProfileCompleted;
    private String technicianType;
    private String technicianApprovalStatus;
    private BigDecimal walletBalance;
    @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
    private List<Long> categoryIds = new ArrayList<>();
    private List<String> categoryNames = new ArrayList<>();
    private String baseLocation;
    private LocalTime availableFrom;
    private LocalTime availableTo;
    private boolean availableForAutoAssign;
    private Long supervisingTechnicianId;
    private String supervisingTechnicianName;
    private LocalDateTime assistantStartedAt;
    private LocalDateTime assistantPromoteAt;
    private Double averageRating;
    private Long totalReviews;
    private Long completedJobs;

    public UserDto() {
    }

    public UserDto(Long id, String fullName, String email, String phone, String address, String role,
            String avatarUrl) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.role = role;
        this.avatarUrl = avatarUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getWorkDescription() {
        return workDescription;
    }

    public void setWorkDescription(String workDescription) {
        this.workDescription = workDescription;
    }

    public String getCitizenId() {
        return citizenId;
    }

    public void setCitizenId(String citizenId) {
        this.citizenId = citizenId;
    }

    public boolean isTechnicianProfileCompleted() {
        return technicianProfileCompleted;
    }

    public void setTechnicianProfileCompleted(boolean technicianProfileCompleted) {
        this.technicianProfileCompleted = technicianProfileCompleted;
    }

    public String getTechnicianType() {
        return technicianType;
    }

    public void setTechnicianType(String technicianType) {
        this.technicianType = technicianType;
    }

    public String getTechnicianApprovalStatus() {
        return technicianApprovalStatus;
    }

    public void setTechnicianApprovalStatus(String technicianApprovalStatus) {
        this.technicianApprovalStatus = technicianApprovalStatus;
    }

    public BigDecimal getWalletBalance() {
        return walletBalance;
    }

    public void setWalletBalance(BigDecimal walletBalance) {
        this.walletBalance = walletBalance;
    }

    public List<Long> getCategoryIds() {
        return categoryIds;
    }

    public void setCategoryIds(List<Long> categoryIds) {
        this.categoryIds = categoryIds;
    }

    public List<String> getCategoryNames() {
        return categoryNames;
    }

    public void setCategoryNames(List<String> categoryNames) {
        this.categoryNames = categoryNames;
    }

    public String getBaseLocation() {
        return baseLocation;
    }

    public void setBaseLocation(String baseLocation) {
        this.baseLocation = baseLocation;
    }

    public LocalTime getAvailableFrom() {
        return availableFrom;
    }

    public void setAvailableFrom(LocalTime availableFrom) {
        this.availableFrom = availableFrom;
    }

    public LocalTime getAvailableTo() {
        return availableTo;
    }

    public void setAvailableTo(LocalTime availableTo) {
        this.availableTo = availableTo;
    }

    public boolean isAvailableForAutoAssign() {
        return availableForAutoAssign;
    }

    public void setAvailableForAutoAssign(boolean availableForAutoAssign) {
        this.availableForAutoAssign = availableForAutoAssign;
    }

    public Long getSupervisingTechnicianId() {
        return supervisingTechnicianId;
    }

    public void setSupervisingTechnicianId(Long supervisingTechnicianId) {
        this.supervisingTechnicianId = supervisingTechnicianId;
    }

    public String getSupervisingTechnicianName() {
        return supervisingTechnicianName;
    }

    public void setSupervisingTechnicianName(String supervisingTechnicianName) {
        this.supervisingTechnicianName = supervisingTechnicianName;
    }

    public LocalDateTime getAssistantStartedAt() {
        return assistantStartedAt;
    }

    public void setAssistantStartedAt(LocalDateTime assistantStartedAt) {
        this.assistantStartedAt = assistantStartedAt;
    }

    public LocalDateTime getAssistantPromoteAt() {
        return assistantPromoteAt;
    }

    public void setAssistantPromoteAt(LocalDateTime assistantPromoteAt) {
        this.assistantPromoteAt = assistantPromoteAt;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Long totalReviews) {
        this.totalReviews = totalReviews;
    }

    public Long getCompletedJobs() {
        return completedJobs;
    }

    public void setCompletedJobs(Long completedJobs) {
        this.completedJobs = completedJobs;
    }
}
