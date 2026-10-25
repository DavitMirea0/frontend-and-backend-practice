package ru.mirea.project.util;

import java.util.*;

import ru.mirea.project.model.*;

public record DashboardData(List<User> users, List<EquipmentRequest> requests) {
  public DashboardData {
    users = List.copyOf(users);
    requests = List.copyOf(requests);
  }

  public User user(long id) {
    return users.stream().filter(u -> u.getId() == id).findFirst().orElse(null);
  }
}
