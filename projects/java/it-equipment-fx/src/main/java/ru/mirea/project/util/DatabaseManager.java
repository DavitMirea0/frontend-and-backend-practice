package ru.mirea.project.util;

import java.io.*;

import java.nio.charset.StandardCharsets;

import java.nio.file.*;

import java.sql.*;

import java.util.Properties;

import ru.mirea.project.exception.DataAccessException;

public final class DatabaseManager {

  private final String url, user, password;

  public DatabaseManager(String url, String user, String password) {
    this.url = url;
    this.user = user;
    this.password = password;
  }

  public static DatabaseManager fromEnvironment() {
    Properties values = new Properties();

    try (InputStream in = DatabaseManager.class.getResourceAsStream("/database.properties")) {
      if (in != null) values.load(new InputStreamReader(in, StandardCharsets.UTF_8));
      Path external = Path.of(System.getProperty("db.config", "config/database.properties"));
      if (Files.exists(external))
        try (Reader reader = Files.newBufferedReader(external, StandardCharsets.UTF_8)) {
          values.load(reader);
        }
    } catch (IOException e) {
      throw new DataAccessException(
          "Не удалось прочитать настройки базы в config/database.properties.", e);
    }
    return new DatabaseManager(
        setting(values, "db.url", "DB_URL"),
        setting(values, "db.user", "DB_USER"),
        setting(values, "db.password", "DB_PASSWORD"));
  }

  private static String setting(Properties values, String key, String environment) {
    String value = System.getenv().getOrDefault(environment, values.getProperty(key, ""));
    if (value.isBlank())
      throw new DataAccessException("Не задан параметр " + key + ". Проверьте файл подключения.");
    return value;
  }

  public Connection getConnection() throws SQLException {
    Properties options = new Properties();
    options.setProperty("user", user);
    options.setProperty("password", password);

    options.setProperty("connectTimeout", "5");
    options.setProperty("socketTimeout", "15");
    return DriverManager.getConnection(url, options);
  }
}
