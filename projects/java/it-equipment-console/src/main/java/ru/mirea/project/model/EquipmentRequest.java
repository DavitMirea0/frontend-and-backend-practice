package ru.mirea.project.model;

public final class EquipmentRequest {
  private final long id;
  private final long userId;
  private final EquipmentType equipmentType;
  private final int quantity;
  private final String reason;
  private final RequestStatus status;
  private final java.time.LocalDateTime createdAt;

  public EquipmentRequest(
      long id,
      long userId,
      EquipmentType equipmentType,
      int quantity,
      String reason,
      RequestStatus status,
      java.time.LocalDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.equipmentType = equipmentType;
    this.quantity = quantity;
    this.reason = reason;
    this.status = status;
    this.createdAt = createdAt;
  }

  public long getId() {
    return id;
  }

  public long getUserId() {
    return userId;
  }

  public EquipmentType getEquipmentType() {
    return equipmentType;
  }

  public int getQuantity() {
    return quantity;
  }

  public String getReason() {
    return reason;
  }

  public RequestStatus getStatus() {
    return status;
  }

  public java.time.LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
