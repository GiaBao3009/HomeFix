package com.homefix.dto;

import com.homefix.common.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class BookingDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long serviceId;
    private String serviceName;
    private Long technicianId;
    private String technicianName;
    private LocalDateTime bookingTime;
    private String address;
    private String note;
    private String paymentMethod;
    private String paymentStatus;
    private BookingStatus status;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;
    private BigDecimal discountAmount;
    private String couponCode;
    private String rejectionReason;
    private Long couponId;
    private BigDecimal technicianEarning;
    private BigDecimal platformProfit;
    private List<Long> assistantTechnicianIds = new ArrayList<>();
    private List<String> assistantTechnicianNames = new ArrayList<>();

    public BookingDto() {
    }

    public BookingDto(Long id, Long customerId, String customerName, Long serviceId, String serviceName,
            Long technicianId, String technicianName, LocalDateTime bookingTime, String address, String note,
            String paymentMethod, String paymentStatus,
            BookingStatus status, BigDecimal totalPrice, LocalDateTime createdAt, String rejectionReason) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.technicianId = technicianId;
        this.technicianName = technicianName;
        this.bookingTime = bookingTime;
        this.address = address;
        this.note = note;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.status = status;
        this.totalPrice = totalPrice;
        this.createdAt = createdAt;
        this.rejectionReason = rejectionReason;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public Long getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(Long technicianId) {
        this.technicianId = technicianId;
    }

    public String getTechnicianName() {
        return technicianName;
    }

    public void setTechnicianName(String technicianName) {
        this.technicianName = technicianName;
    }

    public LocalDateTime getBookingTime() {
        return bookingTime;
    }

    public void setBookingTime(LocalDateTime bookingTime) {
        this.bookingTime = bookingTime;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(String couponCode) {
        this.couponCode = couponCode;
    }

    public Long getCouponId() {
        return couponId;
    }

    public void setCouponId(Long couponId) {
        this.couponId = couponId;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public BigDecimal getTechnicianEarning() {
        return technicianEarning;
    }

    public void setTechnicianEarning(BigDecimal technicianEarning) {
        this.technicianEarning = technicianEarning;
    }

    public BigDecimal getPlatformProfit() {
        return platformProfit;
    }

    public void setPlatformProfit(BigDecimal platformProfit) {
        this.platformProfit = platformProfit;
    }

    public List<Long> getAssistantTechnicianIds() {
        return assistantTechnicianIds;
    }

    public void setAssistantTechnicianIds(List<Long> assistantTechnicianIds) {
        this.assistantTechnicianIds = assistantTechnicianIds;
    }

    public List<String> getAssistantTechnicianNames() {
        return assistantTechnicianNames;
    }

    public void setAssistantTechnicianNames(List<String> assistantTechnicianNames) {
        this.assistantTechnicianNames = assistantTechnicianNames;
    }
}
