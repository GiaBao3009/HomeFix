package com.homefix.service;

import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServicePackage;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CatalogImportServiceTest {
    @Autowired
    private CatalogImportService catalogImportService;
    @Autowired
    private ServiceCategoryRepository categoryRepository;
    @Autowired
    private ServicePackageRepository packageRepository;

    @BeforeEach
    void setUp() {
        packageRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void importCategories_shouldCreateAndUpdateByHeaderAlias() throws Exception {
        ServiceCategory existing = new ServiceCategory();
        existing.setName("Dien lanh");
        existing.setDescription("Mo ta cu");
        categoryRepository.save(existing);

        MockMultipartFile file = workbookFile("categories.xlsx", workbook -> {
            var sheet = workbook.createSheet("Categories");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Ten danh muc");
            header.createCell(1).setCellValue("Mo ta");
            header.createCell(2).setCellValue("Icon URL");

            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("Dien lanh");
            row1.createCell(1).setCellValue("Cap nhat bang excel");
            row1.createCell(2).setCellValue("https://cdn.test/dien-lanh.png");

            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("Dien nuoc");
            row2.createCell(1).setCellValue("Danh muc moi");
        });

        var result = catalogImportService.importCategories(file);

        assertThat(result.getCreatedCount()).isEqualTo(1);
        assertThat(result.getUpdatedCount()).isEqualTo(1);
        ServiceCategory updated = categoryRepository.findByNameIgnoreCase("Dien lanh").orElseThrow();
        assertThat(updated.getDescription()).isEqualTo("Cap nhat bang excel");
        assertThat(updated.getIconUrl()).isEqualTo("https://cdn.test/dien-lanh.png");
        assertThat(categoryRepository.findByNameIgnoreCase("Dien nuoc")).isPresent();
    }

    @Test
    void importPackages_shouldReadFormulaAndCreateMissingCategory() throws Exception {
        MockMultipartFile file = workbookFile("packages.xlsx", workbook -> {
            var sheet = workbook.createSheet("Services");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("CategoryName");
            header.createCell(1).setCellValue("Ten dich vu");
            header.createCell(2).setCellValue("Gia");
            header.createCell(3).setCellValue("Mo ta");
            header.createCell(4).setCellValue("Detailed Description");
            header.createCell(5).setCellValue("ImageUrls");

            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("May giat");
            row.createCell(1).setCellValue("Bao tri may giat");
            row.createCell(2).setCellFormula("200000+50000");
            row.createCell(3).setCellValue("Mo ta ngan");
            row.createCell(4).setCellValue("Mo ta dai");
            row.createCell(5).setCellValue("https://cdn.test/1.png, https://cdn.test/2.png");
        });

        var result = catalogImportService.importPackages(file);

        assertThat(result.getCreatedCount()).isEqualTo(1);
        ServiceCategory category = categoryRepository.findByNameIgnoreCase("May giat").orElseThrow();
        ServicePackage servicePackage = packageRepository.findByNameIgnoreCaseAndCategoryId("Bao tri may giat", category.getId())
                .orElseThrow();

        assertThat(servicePackage.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(250000));
        assertThat(servicePackage.getDescription()).isEqualTo("Mo ta ngan");
        assertThat(servicePackage.getDetailedDescription()).isEqualTo("Mo ta dai");
        assertThat(servicePackage.getImageUrl()).isEqualTo("https://cdn.test/1.png");
        assertThat(servicePackage.getImages())
                .extracting(image -> image.getImageUrl())
                .containsExactly("https://cdn.test/1.png", "https://cdn.test/2.png");
    }

    @Test
    void importPackages_shouldUpdateExistingWithoutClearingFieldsWhenColumnMissing() throws Exception {
        ServiceCategory category = new ServiceCategory();
        category.setName("Dien nuoc");
        category = categoryRepository.save(category);

        ServicePackage existing = new ServicePackage();
        existing.setCategory(category);
        existing.setName("Thong cong");
        existing.setDescription("Mo ta cu");
        existing.setDetailedDescription("Chi tiet cu");
        existing.setPrice(BigDecimal.valueOf(120000));
        existing.setImageUrl("https://cdn.test/old.png");
        packageRepository.save(existing);

        MockMultipartFile file = workbookFile("packages-update.xlsx", workbook -> {
            var sheet = workbook.createSheet("Services");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Category");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Price");

            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("Dien nuoc");
            row.createCell(1).setCellValue("Thong cong");
            row.createCell(2).setCellValue(180000);
        });

        var result = catalogImportService.importPackages(file);

        assertThat(result.getUpdatedCount()).isEqualTo(1);
        ServicePackage updated = packageRepository.findByNameIgnoreCaseAndCategoryId("Thong cong", category.getId()).orElseThrow();
        assertThat(updated.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(180000));
        assertThat(updated.getDescription()).isEqualTo("Mo ta cu");
        assertThat(updated.getDetailedDescription()).isEqualTo("Chi tiet cu");
        assertThat(updated.getImageUrl()).isEqualTo("https://cdn.test/old.png");
        assertThat(updated.getImages()).isEmpty();
    }

    @Test
    void downloadCategoryTemplate_shouldContainExpectedHeadersAndGuideSheet() throws Exception {
        byte[] bytes = catalogImportService.downloadCategoryTemplate();

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            assertThat(workbook.getSheet("Categories Import")).isNotNull();
            assertThat(workbook.getSheet("Huong dan")).isNotNull();
            Row headerRow = workbook.getSheet("Categories Import").getRow(3);
            assertThat(headerRow.getCell(0).getStringCellValue()).isEqualTo("name");
            assertThat(headerRow.getCell(1).getStringCellValue()).isEqualTo("description");
            assertThat(headerRow.getCell(2).getStringCellValue()).isEqualTo("iconUrl");
        }
    }

    @Test
    void downloadPackageTemplate_shouldContainExpectedHeadersAndGuideSheet() throws Exception {
        byte[] bytes = catalogImportService.downloadPackageTemplate();

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            assertThat(workbook.getSheet("Services Import")).isNotNull();
            assertThat(workbook.getSheet("Huong dan")).isNotNull();
            Row headerRow = workbook.getSheet("Services Import").getRow(3);
            assertThat(headerRow.getCell(0).getStringCellValue()).isEqualTo("categoryName");
            assertThat(headerRow.getCell(1).getStringCellValue()).isEqualTo("name");
            assertThat(headerRow.getCell(2).getStringCellValue()).isEqualTo("price");
            assertThat(headerRow.getCell(7).getStringCellValue()).isEqualTo("status");
        }
    }

    @FunctionalInterface
    private interface WorkbookCustomizer {
        void customize(XSSFWorkbook workbook) throws IOException;
    }

    private MockMultipartFile workbookFile(String filename, WorkbookCustomizer customizer) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            customizer.customize(workbook);
            workbook.write(outputStream);
            return new MockMultipartFile("file", filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", outputStream.toByteArray());
        }
    }
}
