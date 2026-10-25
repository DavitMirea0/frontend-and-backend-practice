package ru.mirea.project;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.*;
import java.sql.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
import ru.mirea.project.exception.*;
import ru.mirea.project.model.*;
import ru.mirea.project.repository.*;
import ru.mirea.project.service.*;
import ru.mirea.project.util.*;

@EnabledIfEnvironmentVariable(named = "TEST_DB_URL", matches = ".+")
class PostgresIntegrationTest {
  @TempDir Path temp;

  @Test
  void jdbcCrudConstraintsAndExcel() throws Exception {
    DatabaseManager db =
        new DatabaseManager(
            System.getenv("TEST_DB_URL"),
            System.getenv().getOrDefault("DB_USER", "it_app"),
            System.getenv().getOrDefault("DB_PASSWORD", "it_demo_password"));
    JdbcUserRepository userRepo = new JdbcUserRepository(db);
    JdbcRequestRepository requestRepo = new JdbcRequestRepository(db);
    UserService users = new UserService(userRepo);
    RequestService requests = new RequestService(requestRepo, users);
    User user =
        users.create("Тест JDBC", "test-" + System.nanoTime() + "@example.org", "Тестирование");
    long requestId = 0;
    try {
      assertThrows(BusinessException.class, () -> users.create("Дубль", user.getEmail(), "Отдел"));
      users.update(user.getId(), "Тест обновления", user.getEmail(), "QA");
      assertEquals("QA", users.get(user.getId()).getDepartment());
      EquipmentRequest request =
          requests.create(user.getId(), EquipmentType.LAPTOP, 2, "JDBC ' тест % _");
      requestId = request.getId();
      assertEquals(RequestStatus.NEW, requests.get(requestId).getStatus());
      assertThrows(BusinessException.class, () -> users.delete(user.getId()));
      requests.update(requestId, user.getId(), EquipmentType.MONITOR, 3, "Мониторы");
      assertEquals(3, requests.get(requestId).getQuantity());
      requests.changeStatus(requestId, RequestStatus.APPROVED);
      assertFalse(requestRepo.changeStatus(requestId, RequestStatus.NEW, RequestStatus.ISSUED));
      long currentId = requestId;
      assertThrows(BusinessException.class, () -> requests.delete(currentId));
      requests.changeStatus(requestId, RequestStatus.CANCELLED);
      Path file = temp.resolve("export.xlsx");
      new ExcelExporter().export(file, users.all(), requests.all());
      try (var in = Files.newInputStream(file);
          var workbook = new XSSFWorkbook(in)) {
        assertEquals(2, workbook.getNumberOfSheets());
        assertEquals(requests.all().size(), workbook.getSheet("Заявки").getLastRowNum());
        assertEquals(users.all().size(), workbook.getSheet("Сотрудники").getLastRowNum());
        assertEquals(
            org.apache.poi.ss.usermodel.CellType.NUMERIC,
            workbook.getSheet("Заявки").getRow(1).getCell(7).getCellType());
      }
      try (Connection c = db.getConnection();
          PreparedStatement s =
              c.prepareStatement(
                  "INSERT INTO equipment_requests(user_id,equipment_type,quantity,reason) VALUES"
                      + " (?,'LAPTOP',0,'invalid')")) {
        s.setLong(1, user.getId());
        assertEquals("23514", assertThrows(SQLException.class, s::executeUpdate).getSQLState());
      }
      requests.delete(requestId);
      assertThrows(EntityNotFoundException.class, () -> requests.get(currentId));
      requestId = 0;
    } finally {
      // Удаляются исключительно записи, созданные этим тестом.
      if (requestId != 0) {
        try (Connection c = db.getConnection();
            PreparedStatement s = c.prepareStatement("DELETE FROM equipment_requests WHERE id=?")) {
          s.setLong(1, requestId);
          s.executeUpdate();
        }
      }
      users.delete(user.getId());
    }
  }
}
