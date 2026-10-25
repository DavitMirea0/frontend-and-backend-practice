package ru.mirea.project.ui;

import java.io.IOException;
import java.nio.file.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import ru.mirea.project.exception.*;
import ru.mirea.project.model.*;
import ru.mirea.project.service.*;
import ru.mirea.project.util.ExcelExporter;

public final class ConsoleUi {
  private final UserService users;
  private final RequestService requests;
  private final Scanner input;

  public ConsoleUi(UserService users, RequestService requests, Scanner input) {
    this.users = users;
    this.requests = requests;
    this.input = input;
  }

  public void run() {
    try {
      while (true) {
        System.out.println(
            "\n"
                + "=== ЗАЯВКИ НА ВЫДАЧУ IT-ОБОРУДОВАНИЯ ===\n"
                + "1. Сотрудники\n"
                + "2. Заявки\n"
                + "3. Поиск\n"
                + "4. Фильтрация\n"
                + "5. Сортировка\n"
                + "6. Статистика\n"
                + "7. Экспорт Excel\n"
                + "8. Вывести таблицы БД\n"
                + "0. Выход");
        int action = number("Действие: ");
        if (action == 0) return;
        safe(
            () -> {
              switch (action) {
                case 1 -> staffMenu();
                case 2 -> requestMenu();
                case 3 -> {
                  int mode = number("1 — по обоснованию, 2 — по ФИО сотрудника: ");
                  if (mode == 1) show(requests.searchReason(line("Текст: ")));
                  else if (mode == 2) show(requests.searchEmployee(line("ФИО: ")));
                  else unknown();
                }
                case 4 -> {
                  int mode = number("1 — по статусу, 2 — по оборудованию: ");
                  if (mode == 1) show(requests.filterStatus(status()));
                  else if (mode == 2) show(requests.filterType(type()));
                  else unknown();
                }
                case 5 -> {
                  int mode = number("1 — по дате, 2 — по количеству (возрастание): ");
                  if (mode == 1 || mode == 2) show(requests.sorted(mode == 2));
                  else unknown();
                }
                case 6 -> requests.statistics().forEach((k, v) -> System.out.println(k + ": " + v));
                case 7 -> export();
                case 8 -> {
                  showUsers();
                  show(requests.all());
                }
                default -> unknown();
              }
            });
      }
    } catch (NoSuchElementException e) {
      System.out.println("\nВвод завершён.");
    }
  }

  private void safe(Runnable action) {
    try {
      action.run();
    } catch (BusinessException | DataAccessException | InvalidPathException e) {
      System.out.println("Ошибка: " + e.getMessage());
    }
  }

  private void staffMenu() {
    while (true) {
      System.out.println(
          "\n"
              + "СОТРУДНИКИ: 1 — список; 2 — по ID; 3 — добавить; 4 — изменить; 5 — удалить; 0 —"
              + " назад");
      int action = number("Действие: ");
      if (action == 0) return;
      safe(
          () -> {
            switch (action) {
              case 1 -> showUsers();
              case 2 -> printUser(users.get(id()));
              case 3 -> {
                User u = users.create(line("ФИО: "), line("Email: "), line("Отдел: "));
                System.out.println("Создан сотрудник #" + u.getId());
              }
              case 4 -> {
                long id = id();
                users.get(id);
                users.update(id, line("ФИО: "), line("Email: "), line("Отдел: "));
                System.out.println("Сохранено.");
              }
              case 5 -> {
                long id = id();
                users.get(id);
                if (confirm()) {
                  users.delete(id);
                  System.out.println("Удалено.");
                }
              }
              default -> unknown();
            }
          });
    }
  }

  private void requestMenu() {
    while (true) {
      System.out.println(
          "\n"
              + "ЗАЯВКИ: 1 — список; 2 — по ID; 3 — создать; 4 — изменить; 5 — статус; 6 — удалить;"
              + " 0 — назад");
      int action = number("Действие: ");
      if (action == 0) return;
      safe(
          () -> {
            switch (action) {
              case 1 -> show(requests.all());
              case 2 -> show(List.of(requests.get(id())));
              case 3 -> {
                EquipmentRequest q =
                    requests.create(
                        userId(), type(), number("Количество (1–10): "), line("Обоснование: "));
                System.out.println("Создана заявка #" + q.getId());
              }
              case 4 -> {
                long id = id();
                requests.get(id);
                requests.update(
                    id, userId(), type(), number("Количество: "), line("Обоснование: "));
                System.out.println("Сохранено.");
              }
              case 5 -> {
                long id = id();
                requests.get(id);
                requests.changeStatus(id, status());
                System.out.println("Статус изменён.");
              }
              case 6 -> {
                long id = id();
                requests.get(id);
                if (confirm()) {
                  requests.delete(id);
                  System.out.println("Удалено.");
                }
              }
              default -> unknown();
            }
          });
    }
  }

  private void export() {
    Path path =
        Path.of(
            "exports",
            "equipment-"
                + java.time.LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss-SSS"))
                + ".xlsx");
    try {
      new ExcelExporter().export(path, users.all(), requests.all());
      System.out.println("Экспорт: " + path.toAbsolutePath());
    } catch (IOException e) {
      System.out.println("Ошибка записи Excel: " + e.getMessage());
    }
  }

  private String line(String prompt) {
    System.out.print(prompt);
    return input.nextLine().strip();
  }

  private int number(String prompt) {
    while (true) {
      try {
        return Integer.parseInt(line(prompt));
      } catch (NumberFormatException e) {
        System.out.println("Ошибка: введите целое число.");
      }
    }
  }

  private long id() {
    while (true) {
      try {
        long value = Long.parseLong(line("ID: "));
        if (value > 0) return value;
      } catch (NumberFormatException ignored) {
      }
      System.out.println("Ошибка: ID должен быть положительным целым числом.");
    }
  }

  private long userId() {
    System.out.println("Сотрудник заявки");
    return id();
  }

  private boolean confirm() {
    return line("Подтвердить удаление (да/нет): ").equalsIgnoreCase("да");
  }

  private void unknown() {
    System.out.println("Неизвестный пункт меню.");
  }

  private EquipmentType type() {
    EquipmentType[] values = EquipmentType.values();
    for (int i = 0; i < values.length; i++)
      System.out.println((i + 1) + ". " + values[i].getLabel());
    return values[choice(values.length) - 1];
  }

  private RequestStatus status() {
    RequestStatus[] values = RequestStatus.values();
    for (int i = 0; i < values.length; i++)
      System.out.println((i + 1) + ". " + values[i].getLabel());
    return values[choice(values.length) - 1];
  }

  private int choice(int max) {
    while (true) {
      int n = number("Выбор: ");
      if (n >= 1 && n <= max) return n;
      System.out.println("Введите число от 1 до " + max);
    }
  }

  private void showUsers() {
    System.out.println("ID | ФИО | Email | Отдел");
    List<User> list = users.all();
    if (list.isEmpty()) System.out.println("Записей нет.");
    list.forEach(this::printUser);
  }

  private void printUser(User u) {
    System.out.printf(
        "%d | %s | %s | %s%n", u.getId(), u.getFullName(), u.getEmail(), u.getDepartment());
  }

  private void show(List<EquipmentRequest> list) {
    System.out.println("ID | Сотрудник ID | Тип | Кол-во | Обоснование | Статус | Создана");
    if (list.isEmpty()) System.out.println("Записей нет.");
    for (EquipmentRequest q : list)
      System.out.printf(
          "%d | %d | %s | %d | %s | %s | %s%n",
          q.getId(),
          q.getUserId(),
          q.getEquipmentType().getLabel(),
          q.getQuantity(),
          q.getReason(),
          q.getStatus().getLabel(),
          q.getCreatedAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));
  }
}
