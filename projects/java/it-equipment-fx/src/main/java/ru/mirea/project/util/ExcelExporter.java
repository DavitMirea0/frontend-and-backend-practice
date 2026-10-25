package ru.mirea.project.util;

import java.io.*;

import java.nio.file.*;

import java.util.*;

import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;

import org.apache.poi.ss.util.CellRangeAddress;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import ru.mirea.project.model.*;

public final class ExcelExporter {

  public void export(Path path, List<User> users, List<EquipmentRequest> requests)

      
      throws IOException {

    Map<Long, String> names =

        users.stream().collect(Collectors.toMap(User::getId, User::getFullName));

    Path parent = path.toAbsolutePath().getParent();

    Files.createDirectories(parent);

    try (XSSFWorkbook book = new XSSFWorkbook()) {

      Sheet sheet = book.createSheet("Заявки");

      header(

          book,

          sheet,

          new String[] {

            
            "ID",

            
            "ID сотрудника",

            
            "Сотрудник",

            
            "Оборудование",

            
            "Количество",

            
            "Обоснование",

            
            "Статус",

            
            "Создана"
          });

      CellStyle date = book.createCellStyle();

      date.setDataFormat(book.createDataFormat().getFormat("dd.mm.yyyy hh:mm"));

      for (EquipmentRequest q : requests) {

        Row r = sheet.createRow(sheet.getLastRowNum() + 1);

        
        r.createCell(0).setCellValue(q.getId());

        
        r.createCell(1).setCellValue(q.getUserId());

        
        r.createCell(2).setCellValue(names.getOrDefault(q.getUserId(), "—"));

        
        r.createCell(3).setCellValue(q.getEquipmentType().getLabel());

        
        r.createCell(4).setCellValue(q.getQuantity());

        
        r.createCell(5).setCellValue(q.getReason());

        
        r.createCell(6).setCellValue(q.getStatus().getLabel());

        
        r.createCell(7).setCellValue(q.getCreatedAt());

        r.getCell(7).setCellStyle(date);
      }

      finish(sheet, 8);

      Sheet staff = book.createSheet("Сотрудники");

      header(book, staff, new String[] {"ID", "ФИО", "Email", "Отдел"});

      for (User u : users) {

        Row r = staff.createRow(staff.getLastRowNum() + 1);

        
        r.createCell(0).setCellValue(u.getId());

        
        r.createCell(1).setCellValue(u.getFullName());

        
        r.createCell(2).setCellValue(u.getEmail());

        
        r.createCell(3).setCellValue(u.getDepartment());
      }

      finish(staff, 4);

      try (OutputStream out = Files.newOutputStream(path, StandardOpenOption.CREATE_NEW)) {

        book.write(out);
      }
    }
  }

  private void header(Workbook book, Sheet sheet, String[] labels) {

    CellStyle style = book.createCellStyle();

    style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());

    style.setFillPattern(FillPatternType.SOLID_FOREGROUND);

    Font font = book.createFont();

    font.setColor(IndexedColors.WHITE.getIndex());

    font.setBold(true);

    style.setFont(font);

    Row row = sheet.createRow(0);

    row.setHeightInPoints(25);

    for (int i = 0; i < labels.length; i++) {

      Cell c = row.createCell(i);

      c.setCellValue(labels[i]);

      c.setCellStyle(style);
    }
  }

  private void finish(Sheet s, int columns) {

    s.createFreezePane(0, 1);

    s.setAutoFilter(new CellRangeAddress(0, s.getLastRowNum(), 0, columns - 1));

    for (int i = 0; i < columns; i++) {

      s.autoSizeColumn(i);

      s.setColumnWidth(i, Math.min(20000, s.getColumnWidth(i) + 700));
    }
  }
}
