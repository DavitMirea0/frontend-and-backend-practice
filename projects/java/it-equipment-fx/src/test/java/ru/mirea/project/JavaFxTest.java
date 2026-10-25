package ru.mirea.project;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.*;
import java.util.concurrent.*;
import java.util.function.BooleanSupplier;
import javafx.application.Platform;
import javafx.embed.swing.SwingFXUtils;
import javafx.fxml.FXMLLoader;
import javafx.scene.*;
import javafx.scene.control.*;
import javafx.stage.Stage;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import ru.mirea.project.controller.*;
import ru.mirea.project.model.*;
import ru.mirea.project.service.*;
import ru.mirea.project.util.*;

@EnabledIfEnvironmentVariable(named = "FX_TEST", matches = "true")
class JavaFxTest {
  static <T> T fx(Callable<T> action) throws Exception {
    FutureTask<T> task = new FutureTask<>(action);
    Platform.runLater(task);
    return task.get(15, TimeUnit.SECONDS);
  }

  static void await(BooleanSupplier condition) throws Exception {
    long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
    while (!fx(condition::getAsBoolean)) {
      if (System.nanoTime() > deadline) fail("Фоновая операция не завершилась");
      Thread.sleep(30);
    }
  }

  @BeforeAll
  static void toolkit() throws Exception {
    CountDownLatch started = new CountDownLatch(1);
    Platform.startup(started::countDown);
    assertTrue(started.await(10, TimeUnit.SECONDS));
    Platform.setImplicitExit(false);
  }

  @AfterAll
  static void stop() {
    Platform.exit();
  }

  static Button button(Parent root, String title) {
    return root.lookupAll(".button").stream()
        .filter(Button.class::isInstance)
        .map(Button.class::cast)
        .filter(b -> b.getText().equals(title))
        .findFirst()
        .orElseThrow();
  }

  @Test
  void loadsEveryFxmlAndExercisesFormsFiltersAndStatistics() throws Exception {
    UserService users = new UserService(new RequestServiceTest.MemoryUsers());
    RequestService requests = new RequestService(new RequestServiceTest.MemoryRequests(), users);
    users.create("Анна Иванова", "anna@example.org", "Разработка");
    users.create("Иван Петров", "ivan@example.org", "Поддержка");
    requests.create(1, EquipmentType.LAPTOP, 1, "Разработка проекта");
    requests.create(2, EquipmentType.MONITOR, 3, "Рабочие места поддержки");
    AppContext context = new AppContext(users, requests);
    FXMLLoader loader = new FXMLLoader(getClass().getResource("/view/main.fxml"));
    Stage stage =
        fx(
            () -> {
              Parent root = loader.load();
              Stage s = new Stage();
              Scene scene = new Scene(root, 1220, 780);
              scene.getStylesheets().add(getClass().getResource("/css/app.css").toExternalForm());
              s.setScene(scene);
              s.show();
              MainController main = loader.getController();
              main.configure(context);
              main.display(context.load());
              root.applyCss();
              root.layout();
              return s;
            });
    MainController main = loader.getController();
    try {
      fx(
          () -> {
            Parent requestsView = (Parent) loader.getNamespace().get("requestsView");
            TextField search = (TextField) requestsView.lookup("#search");
            @SuppressWarnings("unchecked")
            TableView<EquipmentRequest> table =
                (TableView<EquipmentRequest>) requestsView.lookup("#table");
            assertEquals(2, table.getItems().size());
            search.setText("ИВАНОВА");
            assertEquals(1, table.getItems().size());
            @SuppressWarnings("unchecked")
            ComboBox<EquipmentType> type =
                (ComboBox<EquipmentType>) requestsView.lookup("#typeFilter");
            type.setValue(EquipmentType.MONITOR);
            assertTrue(table.getItems().isEmpty());
            type.setValue(null);
            search.clear();
            table.getSelectionModel().select(0);
            assertFalse(button(requestsView, "Изменить").isDisabled());
            snapshot(stage.getScene(), "requests.png");
            ((TabPane) loader.getNamespace().get("tabs")).getSelectionModel().select(2);
            stage.getScene().getRoot().applyCss();
            stage.getScene().getRoot().layout();
            snapshot(stage.getScene(), "statistics.png");
            ((TabPane) loader.getNamespace().get("tabs")).getSelectionModel().select(0);
            return null;
          });
      Ui.Loaded<RequestFormController> form =
          fx(
              () -> {
                Ui.Loaded<RequestFormController> d =
                    Ui.dialog(stage, "request-form.fxml", "Тест заявки");
                d.controller().configure(main, d.stage(), null);
                d.stage().show();
                d.stage().getScene().getRoot().applyCss();
                return d;
              });
      fx(
          () -> {
            Parent root = form.stage().getScene().getRoot();
            button(root, "Сохранить").fire();
            assertEquals("Выберите сотрудника.", ((Label) root.lookup("#error")).getText());
            @SuppressWarnings("unchecked")
            ComboBox<User> employee = (ComboBox<User>) root.lookup("#employee");
            employee.getSelectionModel().select(0);
            @SuppressWarnings("unchecked")
            ComboBox<EquipmentType> equipment = (ComboBox<EquipmentType>) root.lookup("#equipment");
            equipment.setValue(EquipmentType.HEADSET);
            ((TextField) root.lookup("#quantity")).setText("abc");
            button(root, "Сохранить").fire();
            assertTrue(((Label) root.lookup("#error")).getText().contains("целое"));
            ((TextField) root.lookup("#quantity")).setText("2");
            ((TextArea) root.lookup("#reason")).setText("Созвоны с командой");
            snapshot(form.stage().getScene(), "request-form.png");
            button(root, "Сохранить").fire();
            return null;
          });
      await(
          () -> !form.stage().isShowing() && !main.isBusy() && main.data().requests().size() == 3);
      assertEquals(3, requests.all().size());

      fx(
          () -> {
            Ui.Loaded<RequestFormController> edit =
                Ui.dialog(stage, "request-form.fxml", "Изменение");
            edit.controller().configure(main, edit.stage(), requests.get(3));
            edit.stage().show();
            edit.stage().getScene().getRoot().applyCss();
            assertEquals(
                "Созвоны с командой",
                ((TextArea) edit.stage().getScene().lookup("#reason")).getText());
            edit.stage().close();
            Ui.Loaded<StatusFormController> status = Ui.dialog(stage, "status-form.fxml", "Статус");
            status.controller().configure(main, status.stage(), requests.get(3));
            status.stage().show();
            status.stage().getScene().getRoot().applyCss();
            @SuppressWarnings("unchecked")
            ComboBox<RequestStatus> next =
                (ComboBox<RequestStatus>) status.stage().getScene().lookup("#nextStatus");
            assertFalse(next.getItems().contains(RequestStatus.ISSUED));
            status.stage().close();
            Ui.Loaded<EmployeeFormController> employee =
                Ui.dialog(stage, "employee-form.fxml", "Сотрудник");
            employee.controller().configure(main, employee.stage(), users.get(1));
            employee.stage().show();
            employee.stage().getScene().getRoot().applyCss();
            assertEquals(
                "anna@example.org",
                ((TextField) employee.stage().getScene().lookup("#email")).getText());
            employee.stage().close();
            stage.setWidth(1000);
            stage.setHeight(680);
            return null;
          });
      await(() -> stage.getScene().getWidth() < 1000);
      fx(() -> { snapshot(stage.getScene(), "requests-compact.png"); return null; });
    } finally {
      fx(
          () -> {
            stage.close();
            return null;
          });
    }
  }

  @Test
  @EnabledIfEnvironmentVariable(named = "DB_URL", matches = ".+")
  void loadsRealDatabaseThroughProductionConfiguration() throws Exception {
    FXMLLoader loader = new FXMLLoader(getClass().getResource("/view/main.fxml"));
    Stage stage = fx(() -> {
      Stage window = new Stage();
      Scene scene = new Scene(loader.load(), 1220, 780);
      scene.getStylesheets().add(getClass().getResource("/css/app.css").toExternalForm());
      window.setScene(scene);
      MainController main = loader.getController();
      main.configure(AppContext.production()); window.show(); main.refresh();
      return window;
    });
    try {
      MainController main = loader.getController();
      await(() -> !main.isBusy());
      fx(() -> {
        assertTrue(main.data().users().size() >= 5);
        assertTrue(main.data().requests().size() >= 10);
        snapshot(stage.getScene(), "postgresql-data.png");
        return null;
      });
    } finally { fx(() -> { stage.close(); return null; }); }
  }

  private static void snapshot(Scene scene, String name) throws Exception {
    Path directory = Path.of("target/ui-preview");
    Files.createDirectories(directory);
    ImageIO.write(
        SwingFXUtils.fromFXImage(scene.snapshot(null), null),
        "png",
        directory.resolve(name).toFile());
  }
}
