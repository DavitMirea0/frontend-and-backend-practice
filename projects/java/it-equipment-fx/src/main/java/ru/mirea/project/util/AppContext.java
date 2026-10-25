package ru.mirea.project.util;

import ru.mirea.project.repository.*;

import ru.mirea.project.service.*;

public final class AppContext {

  private final UserService users;

  private final RequestService requests;

  public AppContext(UserService users, RequestService requests) {
    this.users = users;
    this.requests = requests;
  }

  public UserService users() {
    return users;
  }

  public RequestService requests() {
    return requests;
  }

  public static AppContext production() {
    DatabaseManager db = DatabaseManager.fromEnvironment();
    UserService users = new UserService(new JdbcUserRepository(db));
    return new AppContext(users, new RequestService(new JdbcRequestRepository(db), users));
  }

  public DashboardData load() {
    return new DashboardData(users.all(), requests.all());
  }
}
