package ru.mirea.project;

import static org.junit.jupiter.api.Assertions.*;

import java.util.*;
import org.junit.jupiter.api.*;
import ru.mirea.project.exception.*;
import ru.mirea.project.model.*;
import ru.mirea.project.repository.*;
import ru.mirea.project.service.*;

class RequestServiceTest {
  private RequestService service;
  private UserService users;
  private MemoryRequests repository;

  @BeforeEach
  void setup() {
    users = new UserService(new MemoryUsers());
    users.create("Анна Иванова", "ANNA@example.org", "Разработка");
    repository = new MemoryRequests();
    service = new RequestService(repository, users);
  }

  @Test
  void validatesQuantityAndReason() {
    for (int quantity : new int[] {-1, 0, 11}) {
      assertThrows(
          BusinessException.class,
          () -> service.create(1, EquipmentType.LAPTOP, quantity, "Работа"));
    }
    assertThrows(BusinessException.class, () -> service.create(1, EquipmentType.LAPTOP, 1, "  "));
    assertThrows(BusinessException.class, () -> service.create(1, null, 1, "Работа"));
    assertThrows(
        EntityNotFoundException.class, () -> service.create(99, EquipmentType.LAPTOP, 1, "Работа"));
    assertEquals(10, service.create(1, EquipmentType.LAPTOP, 10, "Работа").getQuantity());
  }

  @Test
  void statusLifecycleAndDeletionRules() {
    long id = service.create(1, EquipmentType.LAPTOP, 1, "Разработка").getId();
    assertThrows(BusinessException.class, () -> service.changeStatus(id, RequestStatus.ISSUED));
    assertThrows(BusinessException.class, () -> service.changeStatus(id, null));
    service.changeStatus(id, RequestStatus.APPROVED);
    assertThrows(BusinessException.class, () -> service.delete(id));
    assertThrows(
        BusinessException.class, () -> service.update(id, 1, EquipmentType.MOUSE, 1, "Замена"));
    service.changeStatus(id, RequestStatus.ISSUED);
    assertThrows(BusinessException.class, () -> service.changeStatus(id, RequestStatus.NEW));
    assertThrows(BusinessException.class, () -> service.delete(id));
    long cancelled = service.create(1, EquipmentType.MOUSE, 1, "Замена").getId();
    service.changeStatus(cancelled, RequestStatus.CANCELLED);
    service.delete(cancelled);
    assertThrows(EntityNotFoundException.class, () -> service.get(cancelled));
  }

  @Test
  void searchFilterSortAndStatistics() {
    service.create(1, EquipmentType.LAPTOP, 3, "Разработка сервиса");
    service.create(1, EquipmentType.MOUSE, 1, "Замена мыши");
    assertEquals(1, service.searchReason("РАЗРАБОТКА").size());
    assertEquals(2, service.searchEmployee("иванова").size());
    assertEquals(1, service.filterType(EquipmentType.MOUSE).size());
    assertEquals(2, service.filterStatus(RequestStatus.NEW).size());
    assertEquals(1, service.sorted(true).get(0).getQuantity());
    assertEquals(1, service.sorted(false).get(0).getId());
    assertEquals(4L, service.statistics().get("Запрошено единиц"));
  }

  @Test
  void updatePreservesDateAndNewStatus() {
    EquipmentRequest initial = service.create(1, EquipmentType.MOUSE, 1, "Замена");
    service.update(initial.getId(), 1, EquipmentType.MONITOR, 2, "Новый монитор");
    EquipmentRequest updated = service.get(initial.getId());
    assertEquals(initial.getCreatedAt(), updated.getCreatedAt());
    assertEquals(RequestStatus.NEW, updated.getStatus());
    assertEquals(2, updated.getQuantity());
  }

  @Test
  void emailValidationAndNormalization() {
    assertEquals("anna@example.org", users.get(1).getEmail());
    assertThrows(BusinessException.class, () -> users.create("Имя", "bad email", "Отдел"));
    assertThrows(BusinessException.class, () -> users.create(" ", "a@b.org", "Отдел"));
  }

  // Тестовые реализации интерфейсов: сервис не зависит от JDBC.
  static class MemoryUsers implements UserRepository {
    final Map<Long, User> data = new LinkedHashMap<>();

    public User create(User u) {
      long id = data.size() + 1;
      User saved = new User(id, u.getFullName(), u.getEmail(), u.getDepartment());
      data.put(id, saved);
      return saved;
    }

    public Optional<User> findById(long id) {
      return Optional.ofNullable(data.get(id));
    }

    public List<User> findAll() {
      return new ArrayList<>(data.values());
    }

    public boolean update(User u) {
      return data.replace(u.getId(), u) != null;
    }

    public boolean delete(long id) {
      return data.remove(id) != null;
    }
  }

  static class MemoryRequests implements RequestRepository {
    final Map<Long, EquipmentRequest> data = new LinkedHashMap<>();
    long sequence;

    public EquipmentRequest create(EquipmentRequest q) {
      EquipmentRequest saved =
          new EquipmentRequest(
              ++sequence,
              q.getUserId(),
              q.getEquipmentType(),
              q.getQuantity(),
              q.getReason(),
              RequestStatus.NEW,
              q.getCreatedAt());
      data.put(sequence, saved);
      return saved;
    }

    public Optional<EquipmentRequest> findById(long id) {
      return Optional.ofNullable(data.get(id));
    }

    public List<EquipmentRequest> findAll() {
      return new ArrayList<>(data.values());
    }

    public boolean update(EquipmentRequest q) {
      return data.replace(q.getId(), q) != null;
    }

    public boolean delete(long id) {
      return data.remove(id) != null;
    }

    public boolean changeStatus(long id, RequestStatus expected, RequestStatus next) {
      EquipmentRequest q = data.get(id);
      if (q == null || q.getStatus() != expected) return false;
      data.put(
          id,
          new EquipmentRequest(
              id,
              q.getUserId(),
              q.getEquipmentType(),
              q.getQuantity(),
              q.getReason(),
              next,
              q.getCreatedAt()));
      return true;
    }
  }
}
