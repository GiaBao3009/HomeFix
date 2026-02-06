package com.homefix.controller;

import com.homefix.dto.ServicePackageDto;
import com.homefix.entity.ServiceCategory;
import com.homefix.service.HomeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {
    private final HomeService homeService;

    public ServiceController(HomeService homeService) {
        this.homeService = homeService;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ServiceCategory>> getCategories() {
        return ResponseEntity.ok(homeService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<ServiceCategory> createCategory(@RequestBody ServiceCategory category) {
        return ResponseEntity.ok(homeService.createCategory(category));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ServiceCategory> updateCategory(@PathVariable Long id, @RequestBody ServiceCategory category) {
        return ResponseEntity.ok(homeService.updateCategory(id, category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        homeService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/packages")
    public ResponseEntity<List<ServicePackageDto>> getPackages(@RequestParam(required = false) Long categoryId) {
        if (categoryId != null) {
            return ResponseEntity.ok(homeService.getPackagesByCategory(categoryId));
        }
        return ResponseEntity.ok(homeService.getAllPackages());
    }

    @GetMapping("/packages/{id}")
    public ResponseEntity<ServicePackageDto> getPackage(@PathVariable Long id) {
        return ResponseEntity.ok(homeService.getPackageById(id));
    }

    @PostMapping("/packages")
    public ResponseEntity<ServicePackageDto> createPackage(@RequestBody ServicePackageDto dto) {
        return ResponseEntity.ok(homeService.createPackage(dto));
    }

    @PutMapping("/packages/{id}")
    public ResponseEntity<ServicePackageDto> updatePackage(@PathVariable Long id, @RequestBody ServicePackageDto dto) {
        return ResponseEntity.ok(homeService.updatePackage(id, dto));
    }

    @DeleteMapping("/packages/{id}")
    public ResponseEntity<Void> deletePackage(@PathVariable Long id) {
        homeService.deletePackage(id);
        return ResponseEntity.noContent().build();
    }
}
