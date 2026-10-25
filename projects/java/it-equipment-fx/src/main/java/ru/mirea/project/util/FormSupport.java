package ru.mirea.project.util;

import java.util.concurrent.Callable;

import javafx.scene.Parent;

import javafx.scene.control.Label;

import javafx.stage.Stage;

public final class FormSupport {
  private FormSupport() {}

  public static void save(
      Parent root, Label error, Stage stage, Callable<Void> action, Runnable saved) {
    root.setDisable(true);
    error.setText("Сохранение…");
    stage.setOnCloseRequest(
        e -> {
          if (root.isDisable()) e.consume();
        });
    FxTasks.run(
        action,
        ignored -> {
          root.setDisable(false);
          stage.close();
          saved.run();
        },
        e -> {
          root.setDisable(false);
          error.setText(Ui.message(e));
        });
  }
}
