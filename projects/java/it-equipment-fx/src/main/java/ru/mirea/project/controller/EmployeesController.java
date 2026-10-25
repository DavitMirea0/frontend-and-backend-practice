package ru.mirea.project.controller;

import java.util.Locale;

import javafx.collections.*;

import javafx.collections.transformation.*;

import javafx.fxml.FXML;

import javafx.scene.control.*;

import ru.mirea.project.model.User;

import ru.mirea.project.util.*;

public final class EmployeesController {

  @FXML private TableView<User> table;

  @FXML private TableColumn<User, String> nameColumn, emailColumn, departmentColumn;

  @FXML private TextField search;

  @FXML private Button editButton, deleteButton;

  @FXML private Label count;
  private final ObservableList<User> source = FXCollections.observableArrayList();
  private final FilteredList<User> filtered = new FilteredList<>(source);

  private MainController main;

  @FXML

  private void initialize() {
    Ui.column(nameColumn, User::getFullName);
    Ui.column(emailColumn, User::getEmail);
    Ui.column(departmentColumn, User::getDepartment);
    SortedList<User> sorted = new SortedList<>(filtered);
    sorted.comparatorProperty().bind(table.comparatorProperty());
    table.setItems(sorted);
    table.getSortOrder().setAll(nameColumn);
    table.setPlaceholder(new Label("Сотрудники не найдены."));
    search.textProperty().addListener((o, a, b) -> filter());
    table
        .getSelectionModel()
        .selectedItemProperty()
        .addListener(
            (o, a, b) -> {
              editButton.setDisable(b == null);
              deleteButton.setDisable(b == null);
            });
    editButton.setDisable(true);
    deleteButton.setDisable(true);
  }

  public void configure(MainController main) {
    this.main = main;
  }

  public void display(DashboardData data) {
    source.setAll(data.users());
    filter();
  }

  private void filter() {
    String term = search.getText().strip().toLowerCase(Locale.ROOT);
    filtered.setPredicate(
        u ->
            (u.getFullName() + " " + u.getEmail() + " " + u.getDepartment())
                .toLowerCase(Locale.ROOT)
                .contains(term));
    count.setText("Показано: " + filtered.size() + " из " + source.size());
  }

  @FXML
  private void add() {
    form(null);
  }

  @FXML
  private void edit() {
    User u = table.getSelectionModel().getSelectedItem();
    if (u != null) form(u);
  }

  private void form(User user) {
    try {
      Ui.Loaded<EmployeeFormController> dialog =
          Ui.dialog(
              main.window(),
              "employee-form.fxml",
              user == null ? "Новый сотрудник" : "Изменение сотрудника");
      dialog.controller().configure(main, dialog.stage(), user);
      dialog.stage().showAndWait();
    } catch (Exception e) {
      Ui.error(main.window(), e);
    }
  }

  @FXML
  private void delete() {
    User u = table.getSelectionModel().getSelectedItem();
    if (u == null) return;
    if (Ui.confirm(
        main.window(),
        "Удалить сотрудника?",
        u.getFullName() + "\nБудут удалены сотрудник и ВСЕ его заявки независимо от статуса."
            + "\nУдаление нельзя отменить."))
      main.mutate(
          "Удаление сотрудника…",
          () -> {
            main.context().users().delete(u.getId());
            return null;
          });
  }
}
