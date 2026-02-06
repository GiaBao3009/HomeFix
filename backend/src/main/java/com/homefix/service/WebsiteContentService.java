package com.homefix.service;

import com.homefix.entity.WebsiteContent;
import com.homefix.repository.WebsiteContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WebsiteContentService {

    @Autowired
    private WebsiteContentRepository contentRepository;

    public List<WebsiteContent> getContentBySection(String section) {
        return contentRepository.findBySectionOrderByDisplayOrderAsc(section);
    }

    public Map<String, Object> getStructuredContentBySection(String section) {
        List<WebsiteContent> items = contentRepository.findBySectionOrderByDisplayOrderAsc(section);
        Map<String, Object> result = new HashMap<>();

        // Group by key
        Map<String, List<WebsiteContent>> grouped = items.stream()
                .collect(Collectors.groupingBy(WebsiteContent::getKey));

        grouped.forEach((key, list) -> {
            if (list.size() == 1) {
                // Single item - return object
                result.put(key, list.get(0));
            } else {
                // Multiple items (list) - return list, sorted by order
                list.sort((a, b) -> {
                    int o1 = a.getDisplayOrder() != null ? a.getDisplayOrder() : 0;
                    int o2 = b.getDisplayOrder() != null ? b.getDisplayOrder() : 0;
                    return o1 - o2;
                });
                result.put(key, list);
            }
        });

        return result;
    }

    public WebsiteContent saveContent(WebsiteContent content) {
        return contentRepository.save(content);
    }
}
