package com.homefix.controller;

import com.homefix.entity.Coupon;
import com.homefix.repository.CouponRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponRepository couponRepository;

    public CouponController(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Coupon> createCoupon(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Coupon> updateCoupon(@PathVariable Long id, @RequestBody Coupon couponDetails) {
        return couponRepository.findById(id)
                .map(coupon -> {
                    coupon.setCode(couponDetails.getCode());
                    coupon.setDiscountPercent(couponDetails.getDiscountPercent());
                    coupon.setMaxDiscountAmount(couponDetails.getMaxDiscountAmount());
                    coupon.setMinOrderValue(couponDetails.getMinOrderValue());
                    coupon.setValidUntil(couponDetails.getValidUntil());
                    coupon.setUsageLimit(couponDetails.getUsageLimit());
                    coupon.setStatus(couponDetails.getStatus());
                    return ResponseEntity.ok(couponRepository.save(coupon));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        if (couponRepository.existsById(id)) {
            couponRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
