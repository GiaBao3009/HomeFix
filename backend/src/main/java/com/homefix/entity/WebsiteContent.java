package com.homefix.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "website_content")
public class WebsiteContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false)
    private String key;

    @Column(nullable = false)
    private String section; // HOME, ABOUT, CONTACT, REGISTER, COMMON

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String imageUrl;

    private String linkUrl;

    private Integer displayOrder;

    public WebsiteContent() {
    }

    public WebsiteContent(String section, String key, String title, String content, String imageUrl, Integer displayOrder) {
        this.section = section;
        this.key = key;
        this.title = title;
        this.content = content;
        this.imageUrl = imageUrl;
        this.displayOrder = displayOrder;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
