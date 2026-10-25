package ru.mirea.project.controller;

import java.util.List;

import java.util.concurrent.Callable;

import javafx.fxml.FXML;

import javafx.scene.control.*;

import javafx.scene.layout.*;

import javafx.stage.Window;

import ru.mirea.project.util.*;

public final class MainController {

  @FXML private BorderPane root;

  @FXML private TabPane tabs;

  @FXML private Button refreshButton;

  @FXML private Label status;

  @FXML private ProgressIndicator progress;

  @FXML private RequestsController requestsViewController;

  @FXML private EmployeesController employeesViewController;

  @FXML private StatisticsController statisticsViewController;

  private AppContext context;
  private DashboardData data = new DashboardData(List.of(), List.of());

  private boolean busy;

  public void configure(AppContext context) {
    this.context = context;
    requestsViewController.configure(this);
    employeesViewController.configure(this);
  }

  public AppContext context() {
    return context;
  }

  public DashboardData data() {
    return data;
  }

  public Window window() {
    return root.getScene().getWindow();
  }

  public boolean isBusy() {
    return busy;
  }

  @FXML

  public void refresh() {
    if (busy) return;
    setBusy(true, "Загрузка данных…");
    FxTasks.run(
        context::load,
        this::display,
        e -> {
          setBusy(false, Ui.message(e));
          status.getStyleClass().add("error-text");
        });
  }

  public void display(DashboardData value) {
    data = value;
    requestsViewController.display(value);
    employeesViewController.display(value);
    statisticsViewController.display(value);
    setBusy(
        false,
        "Данные обновлены · "
            + value.requests().size()
            + " заявок · "
            + value.users().size()
            + " сотрудников");
  }

  public void mutate(String title, Callable<Void> action) {
    if (busy) return;
    setBusy(true, title);
    FxTasks.run(
        action,
        ignored -> {
          setBusy(false, "Сохранено");
          refresh();
        },
        e -> {
          setBusy(false, Ui.message(e));
          Ui.error(window(), e);
        });
  }

  public void setBusy(boolean value, String message) {
    busy = value;
    tabs.setDisable(value);
    refreshButton.setDisable(value);
    progress.setVisible(value);
    progress.setManaged(value);
    status.getStyleClass().remove("error-text");
    status.setText(message);
  }
}
