package com.homefix.repository;

import com.homefix.entity.WebsiteContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WebsiteContentRepository extends JpaRepository<WebsiteContent, Long> {
    List<WebsiteContent> findBySectionOrderByDisplayOrderAsc(String section);
    List<WebsiteContent> findBySectionAndKeyOrderByDisplayOrderAsc(String section, String key);
    Optional<WebsiteContent> findFirstBySectionAndKey(String section, String key);
}
