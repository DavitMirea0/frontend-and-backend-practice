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
  void deletingEmployeeCascadesAllStatusesAndPreservesOtherEmployees() throws Exception {
    DatabaseManager db = new DatabaseManager(System.getenv("TEST_DB_URL"),
        System.getenv().getOrDefault("DB_USER", "it_app"),
        System.getenv().getOrDefault("DB_PASSWORD", "it_demo_password"));
    UserService users = new UserService(new JdbcUserRepository(db));
    JdbcRequestRepository repository = new JdbcRequestRepository(db);
    RequestService requests = new RequestService(repository, users);
    long deletedUser = users.create("Каскад", "cascade-" + System.nanoTime() + "@test.org", "QA").getId();
    long otherUser = users.create("Другой", "other-" + System.nanoTime() + "@test.org", "QA").getId();
    try {
      java.util.List<Long> ids = new java.util.ArrayList<>();
      for (RequestStatus status : RequestStatus.values()) {
        long id = requests.create(deletedUser, EquipmentType.LAPTOP, 1, "Проверка каскада").getId();
        ids.add(id);
        if (status == RequestStatus.ISSUED) requests.changeStatus(id, RequestStatus.APPROVED);
        if (status != RequestStatus.NEW) requests.changeStatus(id, status);
      }
      long otherRequest = requests.create(otherUser, EquipmentType.MONITOR, 1, "Сохранить").getId();
      users.delete(deletedUser);
      assertThrows(EntityNotFoundException.class, () -> users.get(deletedUser));
      for (long id : ids) assertTrue(repository.findById(id).isEmpty());
      assertEquals(otherUser, users.get(otherUser).getId());
      assertEquals(otherUser, requests.get(otherRequest).getUserId());
      assertThrows(EntityNotFoundException.class, () -> users.delete(deletedUser));
    } finally {
      try (Connection c = db.getConnection();
          PreparedStatement children = c.prepareStatement("DELETE FROM equipment_requests WHERE user_id IN (?,?)");
          PreparedStatement parents = c.prepareStatement("DELETE FROM users WHERE id IN (?,?)")) {
        children.setLong(1, deletedUser); children.setLong(2, otherUser); children.executeUpdate();
        parents.setLong(1, deletedUser); parents.setLong(2, otherUser); parents.executeUpdate();
      }
    }
  }

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
