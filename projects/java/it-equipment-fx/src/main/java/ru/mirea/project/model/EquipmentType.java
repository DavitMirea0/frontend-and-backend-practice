package ru.mirea.project.model;

public enum EquipmentType {

  LAPTOP("Ноутбук"),

  MONITOR("Монитор"),

  KEYBOARD("Клавиатура"),

  MOUSE("Мышь"),

  HEADSET("Гарнитура");

  
  private final String label;

  EquipmentType(String label) {

    
    this.label = label;
  }

  public String getLabel() {

    return label;
  }
}
