package ru.mirea.project.service;

import java.util.*;

import ru.mirea.project.exception.*;

import ru.mirea.project.model.User;

import ru.mirea.project.repository.UserRepository;

public final class UserService {

  
  private final UserRepository repository;

  public UserService(UserRepository repository) {

    
    this.repository = repository;
  }

  public List<User> all() {

    return repository.findAll();
  }

  public User get(long id) {

    return repository

        .findById(id)

        
        .orElseThrow(() -> new EntityNotFoundException("Сотрудник #" + id + " не найден."));
  }

  private User validated(long id, String name, String email, String department) {

    name = Validation.text(name, "ФИО", 120);

    
    email = Validation.text(email, "Email", 160).toLowerCase(Locale.ROOT);

    department = Validation.text(department, "Отдел", 100);

    if (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))

      throw new BusinessException("Некорректный email.");

    return new User(id, name, email, department);
  }

  public User create(String name, String email, String department) {

    return repository.create(validated(0, name, email, department));
  }

  public void update(long id, String name, String email, String department) {

    get(id);

    if (!repository.update(validated(id, name, email, department)))

      throw new EntityNotFoundException("Сотрудник удалён другим пользователем.");
  }

  public void delete(long id) {

    get(id);

    if (!repository.delete(id)) throw new EntityNotFoundException("Сотрудник уже удалён.");
  }
}
