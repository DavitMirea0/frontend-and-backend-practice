package ru.mirea.project.util;

import java.util.concurrent.Callable;

import java.util.function.Consumer;

import javafx.concurrent.Task;

public final class FxTasks {
  private FxTasks() {}

  public static <T> void run(Callable<T> work, Consumer<T> success, Consumer<Throwable> failure) {
    Task<T> task =
        new Task<>() {
          @Override
          protected T call() throws Exception {
            return work.call();
          }
        };

    task.setOnSucceeded(e -> success.accept(task.getValue()));
    task.setOnFailed(e -> failure.accept(task.getException()));
    Thread thread = new Thread(task, "it-equipment-io");
    thread.setDaemon(true);
    thread.start();
  }
}
