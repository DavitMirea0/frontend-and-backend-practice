package ru.mirea.project.controller;

import java.io.File;

import java.nio.file.*;

import java.time.LocalDateTime;

import java.time.format.DateTimeFormatter;

import java.util.*;

import javafx.collections.*;

import javafx.collections.transformation.*;

import javafx.fxml.FXML;

import javafx.scene.control.*;

import javafx.stage.FileChooser;

import ru.mirea.project.model.*;

import ru.mirea.project.service.RequestFilter;

import ru.mirea.project.util.*;

public final class RequestsController {

  @FXML private TableView<EquipmentRequest> table;

  @FXML private TableColumn<EquipmentRequest, Long> numberColumn;
  @FXML
  private TableColumn<EquipmentRequest, String> employeeColumn,
      typeColumn,
      statusColumn,
      reasonColumn;

  @FXML private TableColumn<EquipmentRequest, Integer> quantityColumn;

  @FXML private TableColumn<EquipmentRequest, LocalDateTime> dateColumn;

  @FXML private TextField search;

  @FXML private ComboBox<RequestStatus> statusFilter;

  @FXML private ComboBox<EquipmentType> typeFilter;

  @FXML private Button editButton, deleteButton, statusButton, detailsButton;

  @FXML private Label count;
  private final ObservableList<EquipmentRequest> source = FXCollections.observableArrayList();
  private final FilteredList<EquipmentRequest> filtered = new FilteredList<>(source);

  private MainController main;

  @FXML

  private void initialize() {
    Ui.column(numberColumn, EquipmentRequest::getId);
    Ui.column(employeeColumn, this::employee);
    Ui.column(typeColumn, q -> q.getEquipmentType().getLabel());
    Ui.column(quantityColumn, EquipmentRequest::getQuantity);
    Ui.column(statusColumn, q -> q.getStatus().getLabel());
    Ui.column(reasonColumn, EquipmentRequest::getReason);
    Ui.column(dateColumn, EquipmentRequest::getCreatedAt);
    dateColumn.setCellFactory(
        c ->
            new TableCell<>() {
              @Override
              protected void updateItem(LocalDateTime date, boolean empty) {
                super.updateItem(date, empty);
                setText(
                    empty || date == null
                        ? null
                        : date.format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")));
              }
            });
    SortedList<EquipmentRequest> sorted = new SortedList<>(filtered);

    sorted.comparatorProperty().bind(table.comparatorProperty());
    table.setItems(sorted);
    dateColumn.setSortType(TableColumn.SortType.DESCENDING);
    table.getSortOrder().setAll(dateColumn);
    statusFilter.getItems().add(null);
    statusFilter.getItems().addAll(RequestStatus.values());
    Ui.labels(statusFilter, RequestStatus::getLabel, "Все статусы");
    typeFilter.getItems().add(null);
    typeFilter.getItems().addAll(EquipmentType.values());
    Ui.labels(typeFilter, EquipmentType::getLabel, "Всё оборудование");
    search.textProperty().addListener((o, a, b) -> filter());
    statusFilter.valueProperty().addListener((o, a, b) -> filter());
    typeFilter.valueProperty().addListener((o, a, b) -> filter());
    table.getSelectionModel().selectedItemProperty().addListener((o, a, b) -> buttons());
    table.setOnMouseClicked(
        e -> {
          if (e.getClickCount() == 2 && selected() != null) details();
        });
    table.setPlaceholder(new Label("Заявки не найдены. Измените фильтры или добавьте заявку."));
    buttons();
  }

  public void configure(MainController main) {
    this.main = main;
  }

  public void display(DashboardData data) {
    source.setAll(data.requests());
    filter();
    table.refresh();
    buttons();
  }

  private String employee(EquipmentRequest q) {
    User u = main == null ? null : main.data().user(q.getUserId());
    return u == null ? "Сотрудник не найден" : u.getFullName();
  }

  private EquipmentRequest selected() {
    return table.getSelectionModel().getSelectedItem();
  }

  private void buttons() {
    EquipmentRequest q = selected();
    boolean none = q == null;
    detailsButton.setDisable(none);
    editButton.setDisable(none || q.getStatus() != RequestStatus.NEW);
    deleteButton.setDisable(
        none || q.getStatus() == RequestStatus.APPROVED || q.getStatus() == RequestStatus.ISSUED);
    statusButton.setDisable(
        none
            || Arrays.stream(RequestStatus.values())
                .noneMatch(s -> q.getStatus().canTransitionTo(s)));
  }

  private void filter() {
    RequestFilter filter =
        new RequestFilter(search.getText(), statusFilter.getValue(), typeFilter.getValue());
    filtered.setPredicate(
        q -> filter.matches(q, main == null ? null : main.data().user(q.getUserId())));
    count.setText("Показано: " + filtered.size() + " из " + source.size());
  }

  @FXML

  private void reset() {
    search.clear();
    statusFilter.setValue(null);
    typeFilter.setValue(null);
  }

  @FXML
  private void add() {
    if (main.data().users().isEmpty()) {
      Ui.info(main.window(), "Сначала добавьте сотрудника на вкладке «Сотрудники».");
      return;
    }
    form(null);
  }

  @FXML
  private void edit() {
    if (selected() != null) form(selected());
  }

  private void form(EquipmentRequest request) {
    try {
      Ui.Loaded<RequestFormController> dialog =
          Ui.dialog(
              main.window(),
              "request-form.fxml",
              request == null ? "Новая заявка" : "Изменение заявки №" + request.getId());
      dialog.controller().configure(main, dialog.stage(), request);
      dialog.stage().showAndWait();
    } catch (Exception e) {
      Ui.error(main.window(), e);
    }
  }

  @FXML
  private void delete() {
    EquipmentRequest q = selected();
    if (q == null) return;
    if (Ui.confirm(
        main.window(),
        "Удалить заявку №" + q.getId() + "?",
        employee(q)
            + " · "
            + q.getEquipmentType().getLabel()
            + " · "
            + q.getQuantity()
            + " шт.\nУдаление нельзя отменить."))
      main.mutate(
          "Удаление заявки…",
          () -> {
            main.context().requests().delete(q.getId());
            return null;
          });
  }

  @FXML
  private void changeStatus() {
    EquipmentRequest q = selected();
    if (q == null) return;
    try {
      Ui.Loaded<StatusFormController> dialog =
          Ui.dialog(main.window(), "status-form.fxml", "Статус заявки №" + q.getId());
      dialog.controller().configure(main, dialog.stage(), q);
      dialog.stage().showAndWait();
    } catch (Exception e) {
      Ui.error(main.window(), e);
    }
  }

  @FXML

  private void details() {
    EquipmentRequest q = selected();
    if (q == null) return;
    User u = main.data().user(q.getUserId());
    String person =
        u == null
            ? "Сотрудник не найден"
            : u.getFullName() + "\nОтдел: " + u.getDepartment() + "\nEmail: " + u.getEmail();
    Alert dialog = new Alert(Alert.AlertType.INFORMATION);
    dialog.initOwner(main.window());
    dialog.setTitle("Заявка №" + q.getId());
    dialog.setHeaderText(
        q.getEquipmentType().getLabel()
            + " · "
            + q.getQuantity()
            + " шт. · "
            + q.getStatus().getLabel());
    TextArea text =
        new TextArea(
            person
                + "\nСоздана: "
                + q.getCreatedAt().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
                + "\n\nОбоснование:\n"
                + q.getReason());
    text.setEditable(false);
    text.setWrapText(true);
    text.setPrefSize(580, 280);
    dialog.getDialogPane().setContent(text);
    dialog.showAndWait();
  }

  @FXML

  private void export() {
    FileChooser chooser = new FileChooser();
    chooser.setTitle("Экспорт показанных заявок");
    chooser.setInitialFileName("it-equipment.xlsx");
    chooser
        .getExtensionFilters()
        .add(new FileChooser.ExtensionFilter("Книга Excel (*.xlsx)", "*.xlsx"));
    File file = chooser.showSaveDialog(main.window());
    if (file == null) return;
    Path path = file.toPath();
    if (!path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".xlsx"))
      path = path.resolveSibling(path.getFileName() + ".xlsx");
    final Path destination = path;
    if (Files.exists(destination)
        && !Ui.confirm(main.window(), "Заменить файл?", destination.getFileName().toString()))
      return;

    List<EquipmentRequest> visible = List.copyOf(table.getItems());
    Set<Long> ids = new HashSet<>();
    visible.forEach(q -> ids.add(q.getUserId()));
    List<User> people = main.data().users().stream().filter(u -> ids.contains(u.getId())).toList();
    main.setBusy(true, "Создание Excel…");
    FxTasks.run(
        () -> {

          Path temporary =
              Files.createTempFile(destination.toAbsolutePath().getParent(), "it-export-", ".xlsx");
          try {
            Files.delete(temporary);
            new ExcelExporter().export(temporary, people, visible);
            Files.move(temporary, destination, StandardCopyOption.REPLACE_EXISTING);
          } finally {
            Files.deleteIfExists(temporary);
          }
          return destination;
        },
        saved -> {
          main.setBusy(false, "Экспортировано заявок: " + visible.size());
          Ui.info(main.window(), "Файл сохранён:\n" + saved.toAbsolutePath());
        },
        e -> {
          main.setBusy(false, Ui.message(e));
          Ui.error(main.window(), e);
        });
  }
}
