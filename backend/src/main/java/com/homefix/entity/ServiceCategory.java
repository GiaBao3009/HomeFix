package com.homefix.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "service_categories")
public class ServiceCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(name = "icon_url")
    private String iconUrl;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<ServicePackage> servicePackages;

    public ServiceCategory() {
    }

    public ServiceCategory(Long id, String name, String description, String iconUrl,
            List<ServicePackage> servicePackages) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.iconUrl = iconUrl;
        this.servicePackages = servicePackages;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }

    public List<ServicePackage> getServicePackages() {
        return servicePackages;
    }

    public void setServicePackages(List<ServicePackage> servicePackages) {
        this.servicePackages = servicePackages;
    }
}
