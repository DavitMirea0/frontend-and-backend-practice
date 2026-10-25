package ru.mirea.project;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import ru.mirea.project.model.*;
import ru.mirea.project.service.RequestFilter;

class RequestFilterTest {
  private final User user = new User(1, "Анна Иванова", "a@example.org", "Разработка");
  private final EquipmentRequest request =
      new EquipmentRequest(
          1,
          1,
          EquipmentType.LAPTOP,
          2,
          "Работа над проектом",
          RequestStatus.NEW,
          LocalDateTime.now());

  @Test
  void combinesSearchAndBothFilters() {
    assertTrue(
        new RequestFilter("ИВАНОВА", RequestStatus.NEW, EquipmentType.LAPTOP)
            .matches(request, user));
    assertTrue(new RequestFilter("проектом", null, null).matches(request, user));
    assertFalse(
        new RequestFilter("Иванова", RequestStatus.APPROVED, EquipmentType.LAPTOP)
            .matches(request, user));
    assertFalse(
        new RequestFilter("Иванова", RequestStatus.NEW, EquipmentType.MONITOR)
            .matches(request, user));
    assertFalse(
        new RequestFilter("Петров", RequestStatus.NEW, EquipmentType.LAPTOP)
            .matches(request, user));
  }

  @Test
  void handlesEmptySearchAndMissingRelatedUser() {
    assertTrue(new RequestFilter(" ", null, null).matches(request, null));
    assertFalse(new RequestFilter("Иванова", null, null).matches(request, null));
  }
}
