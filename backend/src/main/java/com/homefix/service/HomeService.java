package com.homefix.service;

import com.homefix.dto.ServicePackageDto;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServiceImage;
import com.homefix.entity.ServicePackage;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HomeService {
    private final ServiceCategoryRepository categoryRepository;
    private final ServicePackageRepository packageRepository;

    public HomeService(ServiceCategoryRepository categoryRepository, ServicePackageRepository packageRepository) {
        this.categoryRepository = categoryRepository;
        this.packageRepository = packageRepository;
    }

    public List<ServiceCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    public ServiceCategory createCategory(ServiceCategory category) {
        return categoryRepository.save(category);
    }

    public ServiceCategory updateCategory(Long id, ServiceCategory categoryDetails) {
        ServiceCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        category.setName(categoryDetails.getName());
        category.setDescription(categoryDetails.getDescription());
        category.setIconUrl(categoryDetails.getIconUrl());

        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    public List<ServicePackageDto> getAllPackages() {
        return packageRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ServicePackageDto> getPackagesByCategory(Long categoryId) {
        return packageRepository.findByCategoryId(categoryId).stream()
                .map(this::mapToDto)
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
        packageRepository.deleteById(id);
    }

    private ServicePackageDto mapToDto(ServicePackage entity) {
        ServicePackageDto dto = new ServicePackageDto(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getImageUrl(),
                entity.getCategory().getId(),
                entity.getCategory().getName());
        dto.setDetailedDescription(entity.getDetailedDescription());
        if (entity.getImages() != null) {
            dto.setImageUrls(entity.getImages().stream().map(ServiceImage::getImageUrl).collect(Collectors.toList()));
        }
        return dto;
    }
}
