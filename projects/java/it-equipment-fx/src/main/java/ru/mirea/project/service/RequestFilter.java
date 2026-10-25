package ru.mirea.project.service;

import java.util.Locale;

import ru.mirea.project.model.*;

public record RequestFilter(String text, RequestStatus status, EquipmentType type) {

  public boolean matches(EquipmentRequest request, User user) {
    String term = text == null ? "" : text.strip().toLowerCase(Locale.ROOT);
    String haystack =
        request.getReason()
            + " "
            + (user == null ? "" : user.getFullName() + " " + user.getDepartment());
    return (status == null || request.getStatus() == status)
        && (type == null || request.getEquipmentType() == type)
        && haystack.toLowerCase(Locale.ROOT).contains(term);
  }
}
