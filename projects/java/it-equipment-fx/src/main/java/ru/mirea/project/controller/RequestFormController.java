package ru.mirea.project.controller;

import javafx.fxml.FXML;

import javafx.scene.control.*;

import javafx.scene.layout.VBox;

import javafx.stage.Stage;

import ru.mirea.project.model.*;

import ru.mirea.project.util.*;

public final class RequestFormController {

  @FXML private VBox root;

  @FXML private Label title, error;

  @FXML private ComboBox<User> employee;

  @FXML private ComboBox<EquipmentType> equipment;

  @FXML private TextField quantity;

  @FXML private TextArea reason;

  private MainController main;

  private Stage stage;

  private EquipmentRequest current;

  @FXML

  private void initialize() {

    quantity.textProperty().addListener((o, b, a) -> error.setText(""));
    reason.textProperty().addListener((o, b, a) -> error.setText(""));
    employee.valueProperty().addListener((o, b, a) -> error.setText(""));
    equipment.valueProperty().addListener((o, b, a) -> error.setText(""));
    equipment.getItems().setAll(EquipmentType.values());
    Ui.labels(equipment, EquipmentType::getLabel, "Выберите оборудование");
    Ui.labels(
        employee,
        u -> u.getFullName() + " · " + u.getDepartment() + " · " + u.getEmail(),
        "Выберите сотрудника");
  }

  public void configure(MainController main, Stage stage, EquipmentRequest current) {
    this.main = main;
    this.stage = stage;
    this.current = current;
    employee.getItems().setAll(main.data().users());
    title.setText(current == null ? "Новая заявка" : "Заявка №" + current.getId());
    if (current != null) {
      employee.setValue(main.data().user(current.getUserId()));
      equipment.setValue(current.getEquipmentType());
      quantity.setText(String.valueOf(current.getQuantity()));
      reason.setText(current.getReason());
    } else quantity.setText("1");
  }

  @FXML

  private void save() {
    User user = employee.getValue();
    EquipmentType type = equipment.getValue();
    String text = reason.getText();
    if (user == null) {
      error.setText("Выберите сотрудника.");
      employee.requestFocus();
      return;
    }
    if (type == null) {
      error.setText("Выберите оборудование.");
      equipment.requestFocus();
      return;
    }
    int amount;
    try {
      amount = Integer.parseInt(quantity.getText().strip());
    } catch (NumberFormatException e) {
      error.setText("Количество — целое число от 1 до 10.");
      quantity.requestFocus();
      return;
    }
    if (amount < 1 || amount > 10) {
      error.setText("Количество должно быть от 1 до 10.");
      quantity.requestFocus();
      return;
    }
    if (text == null || text.isBlank() || text.strip().length() > 500) {
      error.setText("Обоснование: от 1 до 500 символов.");
      reason.requestFocus();
      return;
    }

    FormSupport.save(
        root,
        error,
        stage,
        () -> {
          if (current == null) main.context().requests().create(user.getId(), type, amount, text);
          else main.context().requests().update(current.getId(), user.getId(), type, amount, text);
          return null;
        },
        main::refresh);
  }

  @FXML

  private void cancel() {
    stage.close();
  }
}
