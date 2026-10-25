package ru.mirea.project.util;

import java.sql.*;

public final class DatabaseManager {
  private final String url, user, password;

  public DatabaseManager(String url, String user, String password) {
    this.url = url;
    this.user = user;
    this.password = password;
  }

  public static DatabaseManager fromEnvironment() {
    return new DatabaseManager(
        env("DB_URL", "jdbc:postgresql://localhost:5432/it_equipment"),
        env("DB_USER", "it_app"),
        env("DB_PASSWORD", "it_demo_password"));
  }

  private static String env(String key, String fallback) {
    return System.getenv().getOrDefault(key, fallback);
  }

  public Connection getConnection() throws SQLException {
    return DriverManager.getConnection(url, user, password);
  }
}
