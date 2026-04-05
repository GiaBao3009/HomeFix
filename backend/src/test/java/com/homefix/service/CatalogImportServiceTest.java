package com.homefix.service;

import com.homefix.dto.CatalogImportResultDto;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServicePackage;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogImportServiceTest {
    @Mock
    private ServiceCategoryRepository categoryRepository;
    @Mock
    private ServicePackageRepository packageRepository;

    private CatalogImportService catalogImportService;

    @BeforeEach
    void setUp() {
        catalogImportService = new CatalogImportService(categoryRepository, packageRepository);
    }

    @Test
    void importCategories_shouldAcceptGeneratedTemplateWithTitleAndNoteRows() {
        AtomicLong ids = new AtomicLong(1L);

        when(categoryRepository.findByNameIgnoreCase(ArgumentMatchers.anyString())).thenReturn(Optional.empty());
        when(categoryRepository.save(ArgumentMatchers.any(ServiceCategory.class))).thenAnswer(invocation -> {
            ServiceCategory category = invocation.getArgument(0);
            if (category.getId() == null) {
                category.setId(ids.getAndIncrement());
            }
            return category;
        });

        byte[] template = catalogImportService.downloadCategoryTemplate();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "homefix-category-template.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                template
        );

        CatalogImportResultDto result = catalogImportService.importCategories(file);

        assertThat(result.getCreatedCount()).isEqualTo(2);
        assertThat(result.getUpdatedCount()).isZero();
        assertThat(result.getSkippedCount()).isZero();
        assertThat(result.getWarnings()).isEmpty();
    }

    @Test
    void importPackages_shouldAcceptGeneratedTemplateWithTitleAndNoteRows() {
        AtomicLong categoryIds = new AtomicLong(10L);
        AtomicLong packageIds = new AtomicLong(100L);

        when(categoryRepository.findByNameIgnoreCase(ArgumentMatchers.anyString())).thenReturn(Optional.empty());
        when(categoryRepository.save(ArgumentMatchers.any(ServiceCategory.class))).thenAnswer(invocation -> {
            ServiceCategory category = invocation.getArgument(0);
            if (category.getId() == null) {
                category.setId(categoryIds.getAndIncrement());
            }
            return category;
        });

        when(packageRepository.findByNameIgnoreCaseAndCategoryId(ArgumentMatchers.anyString(), ArgumentMatchers.anyLong()))
                .thenReturn(Optional.empty());
        when(packageRepository.save(ArgumentMatchers.any(ServicePackage.class))).thenAnswer(invocation -> {
            ServicePackage servicePackage = invocation.getArgument(0);
            if (servicePackage.getId() == null) {
                servicePackage.setId(packageIds.getAndIncrement());
            }
            return servicePackage;
        });

        byte[] template = catalogImportService.downloadPackageTemplate();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "homefix-service-template.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                template
        );

        CatalogImportResultDto result = catalogImportService.importPackages(file);

        assertThat(result.getCreatedCount()).isEqualTo(2);
        assertThat(result.getUpdatedCount()).isZero();
        assertThat(result.getSkippedCount()).isZero();
        assertThat(result.getWarnings()).isEmpty();
    }
}
