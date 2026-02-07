package com.homefix.service;

import com.homefix.entity.ServiceCategory;
import com.homefix.repository.ServiceCategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServiceCategoryService {
    private final ServiceCategoryRepository repository;

    public ServiceCategoryService(ServiceCategoryRepository repository) {
        this.repository = repository;
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
        repository.delete(category);
    }
}
