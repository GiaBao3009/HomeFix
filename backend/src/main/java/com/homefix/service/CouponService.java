package com.homefix.service;

import com.homefix.entity.Coupon;
import com.homefix.repository.CouponRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CouponService {
    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public Coupon createCoupon(Coupon coupon) {
        if (coupon.getStatus() == null) {
            coupon.setStatus("ACTIVE");
        }
        return couponRepository.save(coupon);
    }

    public Coupon updateCoupon(Long id, Coupon couponDetails) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
        
        coupon.setCode(couponDetails.getCode());
        coupon.setDescription(couponDetails.getDescription());
        coupon.setDiscountPercent(couponDetails.getDiscountPercent());
        coupon.setMaxDiscountAmount(couponDetails.getMaxDiscountAmount());
        coupon.setMinOrderValue(couponDetails.getMinOrderValue());
        coupon.setValidUntil(couponDetails.getValidUntil());
        coupon.setUsageLimit(couponDetails.getUsageLimit());
        if (couponDetails.getStatus() != null) {
            coupon.setStatus(couponDetails.getStatus());
        }
        
        return couponRepository.save(coupon);
    }

    public void deleteCoupon(Long id) {
        if (!couponRepository.existsById(id)) {
            throw new RuntimeException("Coupon not found");
        }
        couponRepository.deleteById(id);
    }

    public Coupon validateCoupon(String code) {
        Optional<Coupon> couponOpt = couponRepository.findByCode(code);
        if (couponOpt.isEmpty()) {
            throw new RuntimeException("Mã giảm giá không tồn tại");
        }

        Coupon coupon = couponOpt.get();
        if (!"ACTIVE".equals(coupon.getStatus())) {
            throw new RuntimeException("Mã giảm giá không khả dụng");
        }

        if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn");
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new RuntimeException("Mã giảm giá đã hết lượt sử dụng");
        }

        return coupon;
    }
}
