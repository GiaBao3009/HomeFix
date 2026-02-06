package com.homefix.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "service_images")
public class ServiceImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "service_package_id")
    private ServicePackage servicePackage;

    public ServiceImage() {
    }

    public ServiceImage(String imageUrl, ServicePackage servicePackage) {
        this.imageUrl = imageUrl;
        this.servicePackage = servicePackage;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public ServicePackage getServicePackage() {
        return servicePackage;
    }

    public void setServicePackage(ServicePackage servicePackage) {
        this.servicePackage = servicePackage;
    }
}
