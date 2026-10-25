package ru.mirea.project;

public final class Launcher {
  private Launcher() {}

  public static void main(String[] args) {
    javafx.application.Application.launch(EquipmentApplication.class, args);
  }
}
