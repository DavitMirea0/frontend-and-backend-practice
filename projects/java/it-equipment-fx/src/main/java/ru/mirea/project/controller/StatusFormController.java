package ru.mirea.project.controller;

import java.util.Arrays;

import javafx.fxml.FXML;

import javafx.scene.control.*;

import javafx.scene.layout.VBox;

import javafx.stage.Stage;

import ru.mirea.project.model.*;

import ru.mirea.project.util.*;

public final class StatusFormController {

  @FXML private VBox root;

  @FXML private Label currentLabel, error;

  @FXML private ComboBox<RequestStatus> nextStatus;

  private MainController main;

  private Stage stage;

  private EquipmentRequest request;

  public void configure(MainController main, Stage stage, EquipmentRequest request) {
    this.main = main;
    this.stage = stage;
    this.request = request;
    currentLabel.setText("Текущий статус: " + request.getStatus().getLabel());
    nextStatus
        .getItems()
        .setAll(
            Arrays.stream(RequestStatus.values())
                .filter(request.getStatus()::canTransitionTo)
                .toList());
    Ui.labels(nextStatus, RequestStatus::getLabel, "Выберите новый статус");
  }

  @FXML

  private void save() {
    RequestStatus next = nextStatus.getValue();
    if (next == null) {
      error.setText("Выберите новый статус.");
      return;
    }
    FormSupport.save(
        root,
        error,
        stage,
        () -> {
          main.context().requests().changeStatus(request.getId(), next);
          return null;
        },
        main::refresh);
  }

  @FXML

  private void cancel() {
    stage.close();
  }
}
