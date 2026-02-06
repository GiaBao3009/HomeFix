package com.homefix.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "service_packages")
public class ServicePackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String detailedDescription;

    @OneToMany(mappedBy = "servicePackage", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ServiceImage> images = new java.util.ArrayList<>();

    @Column(length = 20)
    private String status = "ACTIVE";

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ServiceCategory category;

    public ServicePackage() {
    }

    public ServicePackage(Long id, String name, String description, BigDecimal price, String imageUrl, String status,
            ServiceCategory category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.status = status;
        this.category = category;
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

    public String getDetailedDescription() {
        return detailedDescription;
    }

    public void setDetailedDescription(String detailedDescription) {
        this.detailedDescription = detailedDescription;
    }

    public java.util.List<ServiceImage> getImages() {
        return images;
    }

    public void setImages(java.util.List<ServiceImage> images) {
        this.images = images;
    }

    public void addImage(ServiceImage image) {
        images.add(image);
        image.setServicePackage(this);
    }

    public void removeImage(ServiceImage image) {
        images.remove(image);
        image.setServicePackage(null);
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public ServiceCategory getCategory() {
        return category;
    }

    public void setCategory(ServiceCategory category) {
        this.category = category;
    }
}
