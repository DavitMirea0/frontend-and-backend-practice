package ru.mirea.project.service;

import ru.mirea.project.exception.BusinessException;

final class Validation {

  private Validation() {}

  static String text(String value, String name, int max) {

    if (value == null || value.isBlank() || value.strip().length() > max)

      throw new BusinessException(name + ": требуется от 1 до " + max + " символов.");

    return value.strip();
  }
}
