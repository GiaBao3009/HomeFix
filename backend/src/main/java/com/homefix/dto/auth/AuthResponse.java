package com.homefix.dto.auth;

public class AuthResponse {
    private String token;
    private String role;
    private String fullName;
    private Long id;
    private String avatarUrl;
    private boolean technicianProfileCompleted;
    private String technicianType;
    private String technicianApprovalStatus;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;

    public AuthResponse() {
    }

    public AuthResponse(String token, String role, String fullName, Long id, String avatarUrl) {
        this.token = token;
        this.role = role;
        this.fullName = fullName;
        this.id = id;
        this.avatarUrl = avatarUrl;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
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

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
    public String getBankAccountHolder() { return bankAccountHolder; }
    public void setBankAccountHolder(String bankAccountHolder) { this.bankAccountHolder = bankAccountHolder; }
}
