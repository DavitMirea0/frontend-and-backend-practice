package ru.mirea.project.controller;

import javafx.fxml.FXML;

import javafx.scene.control.*;

import javafx.scene.layout.VBox;

import javafx.stage.Stage;

import ru.mirea.project.model.User;

import ru.mirea.project.util.*;

public final class EmployeeFormController {

  @FXML private VBox root;

  @FXML private Label title, error;

  @FXML private TextField fullName, email, department;

  private MainController main;

  private Stage stage;

  private User current;

  public void configure(MainController main, Stage stage, User user) {
    this.main = main;
    this.stage = stage;
    this.current = user;
    title.setText(user == null ? "Новый сотрудник" : "Изменение сотрудника");
    if (user != null) {
      fullName.setText(user.getFullName());
      email.setText(user.getEmail());
      department.setText(user.getDepartment());
    }
  }

  @FXML

  private void save() {
    String name = fullName.getText(), mail = email.getText(), team = department.getText();
    if (name.isBlank() || name.strip().length() > 120) {
      error.setText("ФИО: от 1 до 120 символов.");
      fullName.requestFocus();
      return;
    }
    if (mail.isBlank()
        || mail.strip().length() > 160
        || !mail.strip().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) {
      error.setText("Укажите корректный email до 160 символов.");
      email.requestFocus();
      return;
    }
    if (team.isBlank() || team.strip().length() > 100) {
      error.setText("Отдел: от 1 до 100 символов.");
      department.requestFocus();
      return;
    }
    FormSupport.save(
        root,
        error,
        stage,
        () -> {
          if (current == null) main.context().users().create(name, mail, team);
          else main.context().users().update(current.getId(), name, mail, team);
          return null;
        },
        main::refresh);
  }

  @FXML

  private void cancel() {
    stage.close();
  }
}
