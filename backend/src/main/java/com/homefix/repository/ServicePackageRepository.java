package com.homefix.repository;

import com.homefix.entity.ServicePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ServicePackageRepository extends JpaRepository<ServicePackage, Long> {
    long countByCategoryId(Long categoryId);
    List<ServicePackage> findByCategoryId(Long categoryId);
    Page<ServicePackage> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String q1, String q2, Pageable pageable);
    java.util.Optional<ServicePackage> findByNameIgnoreCaseAndCategoryId(String name, Long categoryId);
}
