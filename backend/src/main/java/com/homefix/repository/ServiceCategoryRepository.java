package com.homefix.repository;

import com.homefix.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {
    boolean existsByName(String name);
    java.util.Optional<ServiceCategory> findByNameIgnoreCase(String name);
}
