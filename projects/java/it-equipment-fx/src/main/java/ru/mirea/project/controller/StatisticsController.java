package ru.mirea.project.controller;

import javafx.fxml.FXML;

import javafx.scene.chart.*;

import javafx.scene.control.*;

import javafx.scene.layout.*;

import ru.mirea.project.model.*;

import ru.mirea.project.util.DashboardData;

public final class StatisticsController {

  @FXML private FlowPane metrics;

  @FXML private BarChart<String, Number> chart;

  public void display(DashboardData data) {
    metrics.getChildren().clear();
    metric("Всего заявок", data.requests().size());
    metric("Сотрудников", data.users().size());
    metric(
        "Запрошено единиц",
        data.requests().stream().mapToLong(EquipmentRequest::getQuantity).sum());
    XYChart.Series<String, Number> series = new XYChart.Series<>();
    for (RequestStatus status : RequestStatus.values()) {
      long count = data.requests().stream().filter(q -> q.getStatus() == status).count();
      metric(status.getLabel(), count);
      series.getData().add(new XYChart.Data<>(status.getLabel(), count));
    }
    chart.getData().setAll(series);

    NumberAxis axis = (NumberAxis) chart.getYAxis();
    long maximum =
        series.getData().stream().mapToLong(item -> item.getYValue().longValue()).max().orElse(0);
    double step = Math.max(1, Math.ceil(maximum / 5.0));
    axis.setAutoRanging(false);
    axis.setLowerBound(0);
    axis.setUpperBound(Math.max(step, Math.ceil(maximum / step) * step));
    axis.setTickUnit(step);
    axis.setMinorTickVisible(false);
  }

  private void metric(String title, long value) {
    Label number = new Label(String.valueOf(value));
    number.getStyleClass().add("metric-number");
    Label label = new Label(title);
    label.getStyleClass().add("muted");
    VBox tile = new VBox(8, number, label);
    tile.getStyleClass().add("metric");
    metrics.getChildren().add(tile);
  }
}
