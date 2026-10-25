package ru.mirea.project.model;

public final class User {

  
  private final long id;

  private final String fullName;

  
  private final String email;

  private final String department;

  public User(long id, String fullName, String email, String department) {

    
    this.id = id;

    
    this.fullName = fullName;

    
    this.email = email;

    
    this.department = department;
  }

  public long getId() {

    return id;
  }

  public String getFullName() {

    return fullName;
  }

  public String getEmail() {

    return email;
  }

  public String getDepartment() {

    return department;
  }
}
