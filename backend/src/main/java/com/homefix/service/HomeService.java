package com.homefix.service;

import com.homefix.dto.ServicePackageDto;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServiceImage;
import com.homefix.entity.ServicePackage;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class HomeService {
    private final ServiceCategoryRepository categoryRepository;
    private final ServicePackageRepository packageRepository;
    private final BookingRepository bookingRepository;
    private final ServiceCategoryService serviceCategoryService;

    public HomeService(ServiceCategoryRepository categoryRepository, ServicePackageRepository packageRepository,
            BookingRepository bookingRepository, ServiceCategoryService serviceCategoryService) {
        this.categoryRepository = categoryRepository;
        this.packageRepository = packageRepository;
        this.bookingRepository = bookingRepository;
        this.serviceCategoryService = serviceCategoryService;
    }

    public List<ServiceCategory> getAllCategories() {
        return serviceCategoryService.getAllCategories();
    }

    public ServiceCategory createCategory(ServiceCategory category) {
        return serviceCategoryService.createCategory(category);
    }

    public ServiceCategory updateCategory(Long id, ServiceCategory categoryDetails) {
        return serviceCategoryService.updateCategory(id, categoryDetails);
    }

    public void deleteCategory(Long id) {
        serviceCategoryService.deleteCategory(id);
    }

    public List<ServicePackageDto> getAllPackages() {
        return packageRepository.findAll().stream()
                .map(this::safeMapToDto)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public List<ServicePackageDto> getPackagesByCategory(Long categoryId) {
        return packageRepository.findByCategoryId(categoryId).stream()
                .map(this::safeMapToDto)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public ServicePackageDto getPackageById(Long id) {
        ServicePackage servicePackage = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        return mapToDto(servicePackage);
    }

    public ServicePackageDto createPackage(ServicePackageDto dto) {
        ServiceCategory category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        ServicePackage servicePackage = new ServicePackage();
        servicePackage.setName(dto.getName());
        servicePackage.setDescription(dto.getDescription());
        servicePackage.setPrice(dto.getPrice());
        servicePackage.setImageUrl(dto.getImageUrl());
        servicePackage.setDetailedDescription(dto.getDetailedDescription());
        servicePackage.setCategory(category);

        if (dto.getImageUrls() != null) {
            // Clear existing images logic if needed, but here we replace the list
            // Because CascadeType.ALL + orphanRemoval=true, setting new list should work if
            // we manage it right
            // Ideally we should clear and addAll, but let's try replacing list
            servicePackage.getImages().clear();
            if (dto.getImageUrls() != null) {
                dto.getImageUrls().forEach(url -> servicePackage.addImage(new ServiceImage(null, url, servicePackage)));
            }
        }

        ServicePackage saved = packageRepository.save(servicePackage);
        return mapToDto(saved);
    }

    public ServicePackageDto updatePackage(Long id, ServicePackageDto dto) {
        ServicePackage servicePackage = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found"));

        ServiceCategory category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        servicePackage.setName(dto.getName());
        servicePackage.setDescription(dto.getDescription());
        servicePackage.setPrice(dto.getPrice());
        servicePackage.setImageUrl(dto.getImageUrl());
        servicePackage.setCategory(category);

        if (dto.getImageUrls() != null) {
            servicePackage.getImages().clear();
            dto.getImageUrls().forEach(url -> servicePackage.addImage(new ServiceImage(null, url, servicePackage)));
        }

        ServicePackage saved = packageRepository.save(servicePackage);
        return mapToDto(saved);
    }

    public void deletePackage(Long id) {
        ServicePackage servicePackage = packageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        long bookingCount = bookingRepository.countByServicePackageId(id);
        if (bookingCount > 0) {
            throw new RuntimeException(
                    "Khong the xoa dich vu vi da co " + bookingCount
                            + " don hang su dung dich vu nay. Hay giu lai dich vu de bao toan lich su mua hang cua nguoi dung.");
        }
        packageRepository.delete(servicePackage);
    }

    public Page<ServicePackageDto> searchPackages(String q, Pageable pageable) {
        Page<ServicePackage> page = packageRepository
                .findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                        q == null ? "" : q, q == null ? "" : q, pageable);
        return page.map(this::mapToDto);
    }

    private ServicePackageDto mapToDto(ServicePackage entity) {
        Long categoryId = null;
        String categoryName = null;
        try {
            if (entity.getCategory() != null) {
                categoryId = entity.getCategory().getId();
                categoryName = entity.getCategory().getName();
            }
        } catch (Exception ignored) {
        }
        ServicePackageDto dto = new ServicePackageDto(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getImageUrl(),
                categoryId,
                categoryName);
        dto.setDetailedDescription(entity.getDetailedDescription());
        try {
            if (entity.getImages() != null) {
                dto.setImageUrls(entity.getImages().stream()
                        .filter(Objects::nonNull)
                        .map(ServiceImage::getImageUrl)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList()));
            } else {
                dto.setImageUrls(Collections.emptyList());
            }
        } catch (Exception ignored) {
            dto.setImageUrls(Collections.emptyList());
        }
        return dto;
    }

    private ServicePackageDto safeMapToDto(ServicePackage entity) {
        try {
            return mapToDto(entity);
        } catch (Exception ignored) {
            return null;
        }
    }
}
