package ru.mirea.project.model;

public enum RequestStatus {

  NEW("Новая"),

  APPROVED("Одобрена"),

  ISSUED("Выдано"),

  REJECTED("Отклонена"),

  CANCELLED("Отменена");

  
  private final String label;

  RequestStatus(String label) {

    
    this.label = label;
  }

  public String getLabel() {

    return label;
  }

  public boolean canTransitionTo(RequestStatus next) {

    return next != null

        && switch (this) {

          case NEW -> next == APPROVED || next == REJECTED || next == CANCELLED;

          case APPROVED -> next == ISSUED || next == CANCELLED;

          default -> false;
        };
  }
}
