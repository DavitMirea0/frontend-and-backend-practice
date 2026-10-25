package ru.mirea.project;

import javafx.application.Application;

import javafx.fxml.FXMLLoader;

import javafx.scene.Scene;

import javafx.scene.control.Alert;

import javafx.stage.Stage;

import ru.mirea.project.controller.MainController;

import ru.mirea.project.util.AppContext;

import ru.mirea.project.util.Ui;

public final class EquipmentApplication extends Application {
  @Override
  public void start(Stage stage) {
    try {

      FXMLLoader loader = new FXMLLoader(getClass().getResource("/view/main.fxml"));
      Scene scene = new Scene(loader.load(), 1220, 780);
      scene.getStylesheets().add(getClass().getResource("/css/app.css").toExternalForm());
      stage.setTitle("IT-оборудование · Заявки на выдачу");
      stage.setMinWidth(1000);
      stage.setMinHeight(680);
      stage.setScene(scene);
      MainController controller = loader.getController();
      controller.configure(AppContext.production());

      stage.setOnCloseRequest(
          event -> {
            if (controller.isBusy()) event.consume();
          });
      stage.show();
      controller.refresh();
    } catch (Exception e) {
      Alert alert = new Alert(Alert.AlertType.ERROR, Ui.message(e));
      alert.setTitle("Не удалось запустить приложение");
      alert.setHeaderText("Проверьте настройки и комплект файлов");
      alert.showAndWait();
      javafx.application.Platform.exit();
    }
  }
}
