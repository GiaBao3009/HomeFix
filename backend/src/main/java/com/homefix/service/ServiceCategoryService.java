package com.homefix.service;

import com.homefix.entity.ServiceCategory;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceCategoryService {
    private final ServiceCategoryRepository repository;
    private final ServicePackageRepository servicePackageRepository;

    public ServiceCategoryService(ServiceCategoryRepository repository,
            ServicePackageRepository servicePackageRepository) {
        this.repository = repository;
        this.servicePackageRepository = servicePackageRepository;
    }

    public List<ServiceCategory> getAllCategories() {
        return repository.findAll();
    }

    public ServiceCategory getCategoryById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    public ServiceCategory createCategory(ServiceCategory category) {
        if (repository.existsByName(category.getName())) {
            throw new RuntimeException("Category with name " + category.getName() + " already exists");
        }
        return repository.save(category);
    }

    public ServiceCategory updateCategory(Long id, ServiceCategory categoryDetails) {
        ServiceCategory category = getCategoryById(id);
        
        // Check if name is taken by another category
        if (!category.getName().equals(categoryDetails.getName()) && 
            repository.existsByName(categoryDetails.getName())) {
            throw new RuntimeException("Category with name " + categoryDetails.getName() + " already exists");
        }

        category.setName(categoryDetails.getName());
        category.setDescription(categoryDetails.getDescription());
        category.setIconUrl(categoryDetails.getIconUrl());
        
        return repository.save(category);
    }

    public void deleteCategory(Long id) {
        ServiceCategory category = getCategoryById(id);
        long packageCount = servicePackageRepository.countByCategoryId(id);
        if (packageCount > 0) {
            throw new RuntimeException(
                    "Khong the xoa danh muc vi van con " + packageCount
                            + " dich vu dang thuoc danh muc nay. Hay chuyen dich vu sang danh muc khac truoc de bao toan lich su don hang.");
        }
        repository.delete(category);
    }
}
