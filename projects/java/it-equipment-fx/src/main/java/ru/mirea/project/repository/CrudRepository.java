package ru.mirea.project.repository;

import java.util.*;

public interface CrudRepository<T> {

  T create(T entity);

  Optional<T> findById(long id);

  List<T> findAll();

  boolean update(T entity);

  boolean delete(long id);
}
