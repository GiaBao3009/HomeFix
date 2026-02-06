package com.homefix.repository;

import com.homefix.entity.ServicePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServicePackageRepository extends JpaRepository<ServicePackage, Long> {
    List<ServicePackage> findByCategoryId(Long categoryId);
}
