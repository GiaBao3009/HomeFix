package com.homefix.dto;

import java.time.LocalDateTime;

public class ReviewDto {
    private Long id;
    private Long bookingId;
    private String serviceName;
    private String customerName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public ReviewDto() {}

    public ReviewDto(Long id, Long bookingId, String serviceName, String customerName, Integer rating, String comment, LocalDateTime createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.serviceName = serviceName;
        this.customerName = customerName;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

