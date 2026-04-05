package com.homefix.service;

import com.homefix.dto.CatalogImportResultDto;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServiceImage;
import com.homefix.entity.ServicePackage;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
public class CatalogImportService {
    private final ServiceCategoryRepository categoryRepository;
    private final ServicePackageRepository packageRepository;

    public CatalogImportService(ServiceCategoryRepository categoryRepository, ServicePackageRepository packageRepository) {
        this.categoryRepository = categoryRepository;
        this.packageRepository = packageRepository;
    }

    @Transactional
    public CatalogImportResultDto importCategories(MultipartFile file) {
        WorkbookContext workbook = openWorkbook(file);
        CatalogImportResultDto result = new CatalogImportResultDto();

        try (Workbook openedWorkbook = workbook.workbook()) {
            Sheet sheet = workbook.firstSheet();
            Map<String, Integer> headerMap = readHeaderMap(sheet.getRow(sheet.getFirstRowNum()));
            requireColumns(headerMap, List.of("name"), "Ten danh muc");

            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row, workbook.formatter(), workbook.evaluator())) {
                    continue;
                }

                String name = getRequiredCell(row, headerMap, workbook, "name");
                if (name == null) {
                    result.setSkippedCount(result.getSkippedCount() + 1);
                    result.addWarning("Dong " + (rowIndex + 1) + ": thieu ten danh muc");
                    continue;
                }

                ServiceCategory category = categoryRepository.findByNameIgnoreCase(name)
                        .orElseGet(ServiceCategory::new);
                boolean creating = category.getId() == null;

                category.setName(name);
                if (hasColumn(headerMap, "description")) {
                    category.setDescription(getOptionalCell(row, headerMap, workbook, "description"));
                }
                if (hasColumn(headerMap, "iconurl")) {
                    category.setIconUrl(getOptionalCell(row, headerMap, workbook, "iconurl"));
                }
                categoryRepository.save(category);

                if (creating) {
                    result.setCreatedCount(result.getCreatedCount() + 1);
                } else {
                    result.setUpdatedCount(result.getUpdatedCount() + 1);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Khong the doc file Excel", e);
        }

        return result;
    }

    @Transactional
    public CatalogImportResultDto importPackages(MultipartFile file) {
        WorkbookContext workbook = openWorkbook(file);
        CatalogImportResultDto result = new CatalogImportResultDto();

        try (Workbook openedWorkbook = workbook.workbook()) {
            Sheet sheet = workbook.firstSheet();
            Map<String, Integer> headerMap = readHeaderMap(sheet.getRow(sheet.getFirstRowNum()));
            requireColumns(headerMap, List.of("name", "price"), "Ten dich vu, Gia");
            if (!hasColumn(headerMap, "categoryname") && !hasColumn(headerMap, "categoryid")) {
                throw new RuntimeException("File import dich vu phai co cot CategoryName hoac CategoryId");
            }

            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row, workbook.formatter(), workbook.evaluator())) {
                    continue;
                }

                String serviceName = getRequiredCell(row, headerMap, workbook, "name");
                BigDecimal price = parsePrice(getOptionalCell(row, headerMap, workbook, "price"));
                ServiceCategory category = resolveCategory(row, headerMap, workbook);

                if (serviceName == null || serviceName.isBlank()) {
                    result.setSkippedCount(result.getSkippedCount() + 1);
                    result.addWarning("Dong " + (rowIndex + 1) + ": thieu ten dich vu");
                    continue;
                }
                if (price == null) {
                    result.setSkippedCount(result.getSkippedCount() + 1);
                    result.addWarning("Dong " + (rowIndex + 1) + ": gia khong hop le");
                    continue;
                }
                if (category == null) {
                    result.setSkippedCount(result.getSkippedCount() + 1);
                    result.addWarning("Dong " + (rowIndex + 1) + ": khong tim thay danh muc");
                    continue;
                }

                ServicePackage servicePackage = packageRepository
                        .findByNameIgnoreCaseAndCategoryId(serviceName, category.getId())
                        .orElseGet(ServicePackage::new);
                boolean creating = servicePackage.getId() == null;

                servicePackage.setCategory(category);
                servicePackage.setName(serviceName);
                if (hasColumn(headerMap, "description")) {
                    servicePackage.setDescription(getOptionalCell(row, headerMap, workbook, "description"));
                }
                if (hasColumn(headerMap, "detaileddescription")) {
                    servicePackage.setDetailedDescription(getOptionalCell(row, headerMap, workbook, "detaileddescription"));
                }
                servicePackage.setPrice(price);
                if (hasColumn(headerMap, "imageurl")) {
                    servicePackage.setImageUrl(getOptionalCell(row, headerMap, workbook, "imageurl"));
                }

                String status = getOptionalCell(row, headerMap, workbook, "status");
                if (status != null && !status.isBlank()) {
                    servicePackage.setStatus(status.trim().toUpperCase(Locale.ROOT));
                }

                if (hasColumn(headerMap, "imageurls")) {
                    replaceImages(servicePackage, parseImageUrls(getOptionalCell(row, headerMap, workbook, "imageurls")));
                }
                packageRepository.save(servicePackage);

                if (creating) {
                    result.setCreatedCount(result.getCreatedCount() + 1);
                } else {
                    result.setUpdatedCount(result.getUpdatedCount() + 1);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Khong the doc file Excel", e);
        }

        return result;
    }

    public byte[] downloadCategoryTemplate() {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.LIGHT_CORNFLOWER_BLUE);
            CellStyle noteStyle = createNoteStyle(workbook);

            Sheet dataSheet = workbook.createSheet("Categories Import");
            Row titleRow = dataSheet.createRow(0);
            titleRow.createCell(0).setCellValue("Mau import danh muc HomeFix");
            titleRow.getCell(0).setCellStyle(titleStyle);

            Row noteRow = dataSheet.createRow(1);
            noteRow.createCell(0).setCellValue("Cot bat buoc: name. Cot khac co the bo trong. He thong update theo ten danh muc neu bi trung.");
            noteRow.getCell(0).setCellStyle(noteStyle);

            String[] headers = {"name", "description", "iconUrl"};
            Row headerRow = dataSheet.createRow(3);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Row sampleRow1 = dataSheet.createRow(4);
            sampleRow1.createCell(0).setCellValue("Dien lanh");
            sampleRow1.createCell(1).setCellValue("Sua chua va bao tri may lanh, tu lanh");
            sampleRow1.createCell(2).setCellValue("https://cdn.homefix.vn/icons/dien-lanh.png");

            Row sampleRow2 = dataSheet.createRow(5);
            sampleRow2.createCell(0).setCellValue("Dien nuoc");
            sampleRow2.createCell(1).setCellValue("Sua ong nuoc, bon cau, thiet bi ve sinh");

            createGuideSheet(
                    workbook,
                    "Huong dan",
                    List.of(
                            new String[]{"name", "Bat buoc", "Ten danh muc de tao moi hoac cap nhat"},
                            new String[]{"description", "Khong bat buoc", "Mo ta ngan hien thi cho admin va user"},
                            new String[]{"iconUrl", "Khong bat buoc", "Link icon/anh dai dien cua danh muc"}
                    )
            );

            autosizeColumns(dataSheet, headers.length);
            return toBytes(workbook);
        } catch (IOException e) {
            throw new RuntimeException("Khong the tao file mau danh muc", e);
        }
    }

    public byte[] downloadPackageTemplate() {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.LIGHT_GREEN);
            CellStyle noteStyle = createNoteStyle(workbook);

            Sheet dataSheet = workbook.createSheet("Services Import");
            Row titleRow = dataSheet.createRow(0);
            titleRow.createCell(0).setCellValue("Mau import dich vu HomeFix");
            titleRow.getCell(0).setCellStyle(titleStyle);

            Row noteRow = dataSheet.createRow(1);
            noteRow.createCell(0).setCellValue("Can co categoryName hoac categoryId. imageUrls co the ghi nhieu link cach nhau boi dau phay.");
            noteRow.getCell(0).setCellStyle(noteStyle);

            String[] headers = {"categoryName", "name", "price", "description", "detailedDescription", "imageUrl", "imageUrls", "status"};
            Row headerRow = dataSheet.createRow(3);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Row sampleRow1 = dataSheet.createRow(4);
            sampleRow1.createCell(0).setCellValue("Dien lanh");
            sampleRow1.createCell(1).setCellValue("Bao tri may lanh");
            sampleRow1.createCell(2).setCellValue(250000);
            sampleRow1.createCell(3).setCellValue("Kiem tra, ve sinh co ban");
            sampleRow1.createCell(4).setCellValue("Bao gom ve sinh dan lanh, dan nong va kiem tra gas");
            sampleRow1.createCell(5).setCellValue("https://cdn.homefix.vn/services/may-lanh-main.png");
            sampleRow1.createCell(6).setCellValue("https://cdn.homefix.vn/services/may-lanh-1.png, https://cdn.homefix.vn/services/may-lanh-2.png");
            sampleRow1.createCell(7).setCellValue("ACTIVE");

            Row sampleRow2 = dataSheet.createRow(5);
            sampleRow2.createCell(0).setCellValue("Dien nuoc");
            sampleRow2.createCell(1).setCellValue("Thong tac bon rua");
            sampleRow2.createCell(2).setCellValue(180000);
            sampleRow2.createCell(3).setCellValue("Thong tac nhanh trong ngay");
            sampleRow2.createCell(7).setCellValue("ACTIVE");

            createGuideSheet(
                    workbook,
                    "Huong dan",
                    List.of(
                            new String[]{"categoryName / categoryId", "Bat buoc", "Chon 1 trong 2. Neu categoryName chua ton tai, he thong se tao moi"},
                            new String[]{"name", "Bat buoc", "Ten dich vu, trung ten trong cung danh muc thi update"},
                            new String[]{"price", "Bat buoc", "Gia dich vu. Ho tro so thuong va o formula"},
                            new String[]{"description", "Khong bat buoc", "Mo ta ngan"},
                            new String[]{"detailedDescription", "Khong bat buoc", "Mo ta chi tiet"},
                            new String[]{"imageUrl", "Khong bat buoc", "Anh dai dien"},
                            new String[]{"imageUrls", "Khong bat buoc", "Nhieu link anh, cach nhau boi dau phay / dau cham phay / xuong dong"},
                            new String[]{"status", "Khong bat buoc", "ACTIVE hoac INACTIVE"}
                    )
            );

            autosizeColumns(dataSheet, headers.length);
            return toBytes(workbook);
        } catch (IOException e) {
            throw new RuntimeException("Khong the tao file mau dich vu", e);
        }
    }

    private void replaceImages(ServicePackage servicePackage, List<String> imageUrls) {
        servicePackage.getImages().clear();
        for (String imageUrl : imageUrls) {
            servicePackage.addImage(new ServiceImage(null, imageUrl, servicePackage));
        }
        if ((servicePackage.getImageUrl() == null || servicePackage.getImageUrl().isBlank()) && !imageUrls.isEmpty()) {
            servicePackage.setImageUrl(imageUrls.get(0));
        }
    }

    private ServiceCategory resolveCategory(Row row, Map<String, Integer> headerMap, WorkbookContext workbook) {
        String categoryIdText = getOptionalCell(row, headerMap, workbook, "categoryid");
        if (categoryIdText != null && !categoryIdText.isBlank()) {
            try {
                long categoryId = Long.parseLong(categoryIdText.trim());
                return categoryRepository.findById(categoryId).orElse(null);
            } catch (NumberFormatException ignored) {
            }
        }

        String categoryName = getOptionalCell(row, headerMap, workbook, "categoryname");
        if (categoryName == null || categoryName.isBlank()) {
            return null;
        }

        Optional<ServiceCategory> existing = categoryRepository.findByNameIgnoreCase(categoryName);
        if (existing.isPresent()) {
            return existing.get();
        }

        ServiceCategory category = new ServiceCategory();
        category.setName(categoryName.trim());
        category.setDescription(getOptionalCell(row, headerMap, workbook, "categorydescription"));
        category.setIconUrl(getOptionalCell(row, headerMap, workbook, "categoryiconurl"));
        return categoryRepository.save(category);
    }

    private WorkbookContext openWorkbook(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui long chon file Excel de import");
        }

        try {
            InputStream inputStream = file.getInputStream();
            Workbook workbook = new XSSFWorkbook(inputStream);
            return new WorkbookContext(workbook, new DataFormatter(), workbook.getCreationHelper().createFormulaEvaluator());
        } catch (IOException e) {
            throw new RuntimeException("Khong the mo file Excel", e);
        }
    }

    private Map<String, Integer> readHeaderMap(Row headerRow) {
        if (headerRow == null) {
            throw new RuntimeException("File Excel khong co dong tieu de");
        }

        Map<String, Integer> headerMap = new HashMap<>();
        short lastCellNum = headerRow.getLastCellNum();
        for (int cellIndex = 0; cellIndex < lastCellNum; cellIndex++) {
            Cell cell = headerRow.getCell(cellIndex);
            String value = normalizeKey(cell == null ? null : cell.getStringCellValue());
            if (!value.isBlank()) {
                headerMap.put(value, cellIndex);
            }
        }
        return headerMap;
    }

    private void requireColumns(Map<String, Integer> headerMap, List<String> requiredKeys, String displayName) {
        boolean allPresent = requiredKeys.stream().allMatch(key -> resolveColumnIndex(headerMap, key) != null);
        if (!allPresent) {
            throw new RuntimeException("File Excel thieu cot bat buoc: " + displayName);
        }
    }

    private boolean hasColumn(Map<String, Integer> headerMap, String key) {
        return resolveColumnIndex(headerMap, key) != null;
    }

    private boolean isBlankRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            if (i < 0) {
                continue;
            }
            Cell cell = row.getCell(i);
            if (cell != null && !formatter.formatCellValue(cell, evaluator).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private String getRequiredCell(Row row, Map<String, Integer> headerMap, WorkbookContext workbook, String key) {
        String value = getOptionalCell(row, headerMap, workbook, key);
        return value == null || value.isBlank() ? null : value;
    }

    private String getOptionalCell(Row row, Map<String, Integer> headerMap, WorkbookContext workbook, String key) {
        Integer index = resolveColumnIndex(headerMap, key);
        if (index == null) {
            return null;
        }
        Cell cell = row.getCell(index);
        if (cell == null) {
            return null;
        }
        String value = workbook.formatter().formatCellValue(cell, workbook.evaluator());
        return value == null ? null : value.trim();
    }

    private Integer resolveColumnIndex(Map<String, Integer> headerMap, String key) {
        if (headerMap.containsKey(key)) {
            return headerMap.get(key);
        }

        return switch (key) {
            case "name" -> firstPresent(headerMap, "name", "servicename", "tendichvu", "tendanhmuc");
            case "description" -> firstPresent(headerMap, "description", "mota", "motangan");
            case "iconurl" -> firstPresent(headerMap, "iconurl", "icon", "iconlink", "anhicon");
            case "detaileddescription" -> firstPresent(headerMap, "detaileddescription", "detail", "chitiet", "motachitiet");
            case "price" -> firstPresent(headerMap, "price", "gia", "baseprice");
            case "imageurl" -> firstPresent(headerMap, "imageurl", "image", "mainimage", "anhdaidien");
            case "imageurls" -> firstPresent(headerMap, "imageurls", "images", "gallery", "danhsachanh");
            case "status" -> firstPresent(headerMap, "status", "trangthai");
            case "categoryname" -> firstPresent(headerMap, "categoryname", "category", "tendanhmuc");
            case "categoryid" -> firstPresent(headerMap, "categoryid", "madanhmuc");
            case "categorydescription" -> firstPresent(headerMap, "categorydescription", "motadanhmuc");
            case "categoryiconurl" -> firstPresent(headerMap, "categoryiconurl", "iconurldanhmuc", "icondanhmuc");
            default -> null;
        };
    }

    private Integer firstPresent(Map<String, Integer> headerMap, String... keys) {
        for (String key : keys) {
            if (headerMap.containsKey(key)) {
                return headerMap.get(key);
            }
        }
        return null;
    }

    private String normalizeKey(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        return normalized.replaceAll("[^a-z0-9]", "");
    }

    private BigDecimal parsePrice(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String normalized = raw.replaceAll("[^0-9,.-]", "");
        if (normalized.isBlank()) {
            return null;
        }
        normalized = normalized.replace(",", "");
        try {
            return new BigDecimal(normalized);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private List<String> parseImageUrls(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        Set<String> urls = new LinkedHashSet<>();
        String[] parts = raw.split("[\\n,;|]+");
        for (String part : parts) {
            String trimmed = part == null ? null : part.trim();
            if (trimmed != null && !trimmed.isBlank()) {
                urls.add(trimmed);
            }
        }
        return new ArrayList<>(urls);
    }

    private void createGuideSheet(Workbook workbook, String name, List<String[]> rows) {
        Sheet guideSheet = workbook.createSheet(name);
        CellStyle headerStyle = createHeaderStyle(workbook, IndexedColors.GREY_25_PERCENT);
        Row headerRow = guideSheet.createRow(0);
        String[] headers = {"Cot", "Yeu cau", "Mo ta"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIndex = 1;
        for (String[] rowData : rows) {
            Row row = guideSheet.createRow(rowIndex++);
            for (int i = 0; i < rowData.length; i++) {
                row.createCell(i).setCellValue(rowData[i]);
            }
        }
        autosizeColumns(guideSheet, headers.length);
    }

    private void autosizeColumns(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 1200, 22000));
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook, IndexedColors fillColor) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setFillForegroundColor(fillColor.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        return style;
    }

    private CellStyle createNoteStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setItalic(true);
        font.setColor(IndexedColors.GREY_80_PERCENT.getIndex());
        style.setFont(font);
        return style;
    }

    private byte[] toBytes(XSSFWorkbook workbook) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        return outputStream.toByteArray();
    }

    private record WorkbookContext(Workbook workbook, DataFormatter formatter, FormulaEvaluator evaluator) {
        private Sheet firstSheet() {
            if (workbook.getNumberOfSheets() == 0) {
                throw new RuntimeException("File Excel khong co sheet nao");
            }
            return workbook.getSheetAt(0);
        }
    }
}
