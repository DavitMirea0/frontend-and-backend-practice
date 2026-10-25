package ru.mirea.project;

import static org.junit.jupiter.api.Assertions.*;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;
import org.junit.jupiter.api.Test;
import ru.mirea.project.repository.*;
import ru.mirea.project.service.*;
import ru.mirea.project.ui.ConsoleUi;
import ru.mirea.project.util.DatabaseManager;

class ConsoleUiTest {
  @Test
  void invalidInputAndMissingIdReturnToMenu() {
    UserService users = new UserService(new RequestServiceTest.MemoryUsers());
    RequestService requests = new RequestService(new RequestServiceTest.MemoryRequests(), users);
    String output = run(users, requests, "abc\n2\n2\nabc\n999\n0\n6\n0\n");
    assertTrue(output.contains("введите целое число"));
    assertTrue(output.contains("ID должен быть"));
    assertTrue(output.contains("не найдена"));
    assertTrue(output.contains("Всего заявок: 0"));
  }

  @Test
  void unavailableDatabaseDoesNotCrashMenu() {
    DatabaseManager db =
        new DatabaseManager("jdbc:postgresql://127.0.0.1:1/missing?connectTimeout=1", "nobody", "");
    UserService users = new UserService(new JdbcUserRepository(db));
    RequestService requests = new RequestService(new JdbcRequestRepository(db), users);
    String output = run(users, requests, "6\n0\n");
    assertTrue(output.contains("Ошибка БД"));
    assertTrue(output.lastIndexOf("=== ЗАЯВКИ") > output.indexOf("Ошибка БД"));
  }

  private String run(UserService users, RequestService requests, String commands) {
    PrintStream original = System.out;
    ByteArrayOutputStream output = new ByteArrayOutputStream();
    try (PrintStream capture = new PrintStream(output, true, StandardCharsets.UTF_8)) {
      System.setOut(capture);
      assertDoesNotThrow(() -> new ConsoleUi(users, requests, new Scanner(commands)).run());
    } finally {
      System.setOut(original);
    }
    return output.toString(StandardCharsets.UTF_8);
  }
}
