package com.homefix.entity;

import com.homefix.common.BookingStatus;
import com.homefix.entity.Coupon;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne
    @JoinColumn(name = "technician_id")
    private User technician;

    @ManyToOne
    @JoinColumn(name = "service_package_id", nullable = false)
    private ServicePackage servicePackage;

    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Column(nullable = false)
    private LocalDateTime bookingTime;

    @Column(nullable = false)
    private String address;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20)")
    private BookingStatus status;

    private BigDecimal totalPrice;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String paymentMethod = "CASH";

    @Column(nullable = false)
    private String paymentStatus = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private LocalDateTime completedAt;

    public Booking() {
    }

    public Booking(Long id, User customer, User technician, ServicePackage servicePackage, LocalDateTime bookingTime,
            String address, String note, BookingStatus status, BigDecimal totalPrice, LocalDateTime createdAt) {
        this.id = id;
        this.customer = customer;
        this.technician = technician;
        this.servicePackage = servicePackage;
        this.bookingTime = bookingTime;
        this.address = address;
        this.note = note;
        this.status = status;
        this.totalPrice = totalPrice;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public User getTechnician() {
        return technician;
    }

    public void setTechnician(User technician) {
        this.technician = technician;
    }

    public ServicePackage getServicePackage() {
        return servicePackage;
    }

    public void setServicePackage(ServicePackage servicePackage) {
        this.servicePackage = servicePackage;
    }

    public Coupon getCoupon() {
        return coupon;
    }

    public void setCoupon(Coupon coupon) {
        this.coupon = coupon;
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

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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
}
