package com.homefix.entity;

import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20)")
    private Role role;

    private String avatarUrl;
    private String specialty;
    private Integer experienceYears;

    @Column(columnDefinition = "TEXT")
    private String workDescription;

    @Column(length = 20)
    private String citizenId;

    @Column(nullable = false)
    private boolean technicianProfileCompleted = false;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20)")
    private TechnicianType technicianType;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20)")
    private TechnicianApprovalStatus technicianApprovalStatus = TechnicianApprovalStatus.NOT_REQUIRED;

    @Column(nullable = false)
    private BigDecimal walletBalance = BigDecimal.ZERO;

    @Column(length = 255)
    private String baseLocation;

    private LocalTime availableFrom;
    private LocalTime availableTo;

    @Column(nullable = false)
    private boolean availableForAutoAssign = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervising_technician_id")
    private User supervisingTechnician;

    @OneToMany(mappedBy = "supervisingTechnician")
    private Set<User> assistantTechnicians = new LinkedHashSet<>();

    private LocalDateTime assistantStartedAt;
    private LocalDateTime assistantPromoteAt;

    @ManyToMany
    @JoinTable(name = "technician_categories", joinColumns = @JoinColumn(name = "technician_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<ServiceCategory> categories = new LinkedHashSet<>();

    public User() {
    }

    public User(Long id, String fullName, String email, String password, String phone, String address, Role role) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.address = address;
        this.role = role;
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

    public void setPassword(String password) {
        this.password = password;
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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
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

    public TechnicianType getTechnicianType() {
        return technicianType;
    }

    public void setTechnicianType(TechnicianType technicianType) {
        this.technicianType = technicianType;
    }

    public TechnicianApprovalStatus getTechnicianApprovalStatus() {
        return technicianApprovalStatus;
    }

    public void setTechnicianApprovalStatus(TechnicianApprovalStatus technicianApprovalStatus) {
        this.technicianApprovalStatus = technicianApprovalStatus;
    }

    public BigDecimal getWalletBalance() {
        return walletBalance;
    }

    public void setWalletBalance(BigDecimal walletBalance) {
        this.walletBalance = walletBalance;
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

    public User getSupervisingTechnician() {
        return supervisingTechnician;
    }

    public void setSupervisingTechnician(User supervisingTechnician) {
        this.supervisingTechnician = supervisingTechnician;
    }

    public Set<User> getAssistantTechnicians() {
        return assistantTechnicians;
    }

    public void setAssistantTechnicians(Set<User> assistantTechnicians) {
        this.assistantTechnicians = assistantTechnicians;
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

    public Set<ServiceCategory> getCategories() {
        return categories;
    }

    public void setCategories(Set<ServiceCategory> categories) {
        this.categories = categories;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
