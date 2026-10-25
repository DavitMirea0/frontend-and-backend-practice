package ru.mirea.project.util;

import java.io.IOException;

import java.sql.SQLException;

import java.util.function.Function;

import javafx.beans.property.ReadOnlyObjectWrapper;

import javafx.fxml.FXMLLoader;

import javafx.scene.*;

import javafx.scene.control.*;

import javafx.stage.*;

import javafx.util.StringConverter;

import ru.mirea.project.exception.*;

public final class Ui {
  private Ui() {}

  public static String message(Throwable e) {
    Throwable current = e;
    while (current != null) {
      if (current instanceof SQLException sql) {
        String state = sql.getSQLState();
        if ("28P01".equals(state) || "28000".equals(state))
          return "PostgreSQL отклонил вход. Проверьте пользователя и пароль в"
                     + " config/database.properties.";
        if ("3D000".equals(state))
          return "База не найдена. Проверьте имя базы КР 1 в настройках подключения.";
        if ("42P01".equals(state))
          return "В базе нет таблиц проекта. Установите схему КР 1 по инструкции.";
        return "База данных недоступна или запрос не выполнен. Проверьте PostgreSQL и настройки"
                   + " подключения. Код: "
            + state;
      }
      current = current.getCause();
    }
    if (e instanceof BusinessException || e instanceof DataAccessException) return e.getMessage();
    if (e instanceof IOException)
      return "Не удалось прочитать или записать файл. Проверьте папку и доступ к файлу.";
    return "Не удалось выполнить действие. Повторите попытку; если ошибка сохраняется, проверьте"
               + " настройки приложения.";
  }

  public static boolean confirm(Window owner, String title, String text) {
    Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
    alert.initOwner(owner);
    alert.setTitle(title);
    alert.setHeaderText(title);
    alert.setContentText(text);
    ButtonType yes = new ButtonType("Подтвердить", ButtonBar.ButtonData.OK_DONE);
    ButtonType no = new ButtonType("Отмена", ButtonBar.ButtonData.CANCEL_CLOSE);
    alert.getButtonTypes().setAll(yes, no);
    return alert.showAndWait().orElse(no) == yes;
  }

  public static void error(Window owner, Throwable e) {
    Alert alert = new Alert(Alert.AlertType.ERROR, message(e), ButtonType.OK);
    alert.initOwner(owner);
    alert.setTitle("Ошибка");
    alert.setHeaderText("Действие не выполнено");
    alert.showAndWait();
  }

  public static void info(Window owner, String text) {
    Alert alert = new Alert(Alert.AlertType.INFORMATION, text, ButtonType.OK);
    alert.initOwner(owner);
    alert.setTitle("Готово");
    alert.setHeaderText(null);
    alert.showAndWait();
  }

  public record Loaded<T>(Stage stage, T controller) {}

  public static <T> Loaded<T> dialog(Window owner, String fxml, String title) throws IOException {
    FXMLLoader loader = new FXMLLoader(Ui.class.getResource("/view/" + fxml));
    Parent root = loader.load();
    Stage stage = new Stage();
    stage.initOwner(owner);
    stage.initModality(Modality.WINDOW_MODAL);
    stage.setTitle(title);
    Scene scene = new Scene(root);
    scene.getStylesheets().add(Ui.class.getResource("/css/app.css").toExternalForm());
    stage.setScene(scene);
    stage.setResizable(false);
    return new Loaded<>(stage, loader.getController());
  }

  public static <T> void labels(ComboBox<T> combo, Function<T, String> name, String empty) {
    combo.setConverter(
        new StringConverter<>() {
          public String toString(T value) {
            return value == null ? empty : name.apply(value);
          }

          public T fromString(String text) {
            throw new UnsupportedOperationException("Список не редактируется текстом");
          }
        });
    combo.setPromptText(empty);
  }

  public static <S, T> void column(TableColumn<S, T> column, Function<S, T> value) {
    column.setCellValueFactory(cell -> new ReadOnlyObjectWrapper<>(value.apply(cell.getValue())));
  }
}
