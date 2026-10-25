package ru.mirea.project.repository;

import ru.mirea.project.model.*;

public interface RequestRepository extends CrudRepository<EquipmentRequest> {

  boolean changeStatus(long id, RequestStatus expected, RequestStatus next);
}
