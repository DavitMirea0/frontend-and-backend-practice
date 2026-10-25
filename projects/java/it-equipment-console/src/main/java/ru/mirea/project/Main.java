package ru.mirea.project;

import java.nio.file.Path;
import java.util.Scanner;
import ru.mirea.project.repository.*;
import ru.mirea.project.service.*;
import ru.mirea.project.ui.ConsoleUi;
import ru.mirea.project.util.*;

public final class Main {
  private Main() {}

  public static void main(String[] args) {
    DatabaseManager db = DatabaseManager.fromEnvironment();
    UserRepository userRepository = new JdbcUserRepository(db);
    RequestRepository requestRepository = new JdbcRequestRepository(db);
    UserService users = new UserService(userRepository);
    RequestService requests = new RequestService(requestRepository, users);
    if (args.length > 0) {
      if (args.length == 2 && args[0].equals("--export")) {
        try {
          new ExcelExporter().export(Path.of(args[1]), users.all(), requests.all());
          System.out.println("Экспорт сохранён: " + args[1]);
        } catch (Exception e) {
          System.err.println("Экспорт не выполнен: " + e.getMessage());
          System.exit(1);
        }
      } else {
        System.err.println("Использование: java -jar ... [--export файл.xlsx]");
        System.exit(2);
      }
      return;
    }
    new ConsoleUi(users, requests, new Scanner(System.in)).run();
  }
}
