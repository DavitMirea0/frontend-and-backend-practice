package ru.mirea.project.repository;

import java.sql.*;
import ru.mirea.project.exception.*;

final class JdbcSupport {
  private JdbcSupport() {}

  static RuntimeException error(SQLException e) {
    String state = e.getSQLState();
    if ("23505".equals(state)) return new BusinessException("Такой email уже зарегистрирован.");
    if ("23503".equals(state))
      return new BusinessException("Связанная запись отсутствует или сотрудник имеет заявки.");
    if ("23514".equals(state) || "23502".equals(state))
      return new BusinessException("Данные нарушают ограничения базы данных.");
    return new DataAccessException(
        "Ошибка БД (SQLState=" + state + "). Проверьте подключение и SQL-скрипты.", e);
  }
}
