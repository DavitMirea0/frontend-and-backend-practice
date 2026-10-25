package ru.mirea.project.service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import ru.mirea.project.exception.*;
import ru.mirea.project.model.*;
import ru.mirea.project.repository.RequestRepository;

public final class RequestService {
  private final RequestRepository repository;
  private final UserService users;

  public RequestService(RequestRepository repository, UserService users) {
    this.repository = repository;
    this.users = users;
  }

  public List<EquipmentRequest> all() {
    return repository.findAll();
  }

  public EquipmentRequest get(long id) {
    return repository
        .findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Заявка #" + id + " не найдена."));
  }

  private EquipmentRequest validated(
      long id, long userId, EquipmentType type, int quantity, String reason, LocalDateTime date) {
    users.get(userId);
    if (type == null) throw new BusinessException("Выберите тип оборудования.");
    if (quantity < 1 || quantity > 10)
      throw new BusinessException("Количество должно быть от 1 до 10.");
    reason = Validation.text(reason, "Обоснование", 500);
    return new EquipmentRequest(id, userId, type, quantity, reason, RequestStatus.NEW, date);
  }

  public EquipmentRequest create(long userId, EquipmentType type, int quantity, String reason) {
    return repository.create(validated(0, userId, type, quantity, reason, LocalDateTime.now()));
  }

  public void update(long id, long userId, EquipmentType type, int quantity, String reason) {
    EquipmentRequest old = get(id);
    if (old.getStatus() != RequestStatus.NEW)
      throw new BusinessException("Редактировать можно только новую заявку.");
    EquipmentRequest next = validated(id, userId, type, quantity, reason, old.getCreatedAt());
    if (!repository.update(next))
      throw new BusinessException("Заявка изменена другим пользователем; перечитайте данные.");
  }

  public void changeStatus(long id, RequestStatus next) {
    EquipmentRequest old = get(id);
    if (!old.getStatus().canTransitionTo(next))
      throw new BusinessException("Переход " + old.getStatus() + " -> " + next + " запрещён.");
    if (!repository.changeStatus(id, old.getStatus(), next))
      throw new BusinessException("Статус уже изменён; перечитайте заявку.");
  }

  public void delete(long id) {
    EquipmentRequest old = get(id);
    if (old.getStatus() == RequestStatus.APPROVED || old.getStatus() == RequestStatus.ISSUED)
      throw new BusinessException("Одобренные и выданные заявки удалять нельзя.");
    if (!repository.delete(id))
      throw new BusinessException("Заявка уже удалена или её статус изменился.");
  }

  public List<EquipmentRequest> searchReason(String text) {
    String term = Validation.text(text, "Текст поиска", 500).toLowerCase(Locale.ROOT);
    return all().stream()
        .filter(q -> q.getReason().toLowerCase(Locale.ROOT).contains(term))
        .toList();
  }

  public List<EquipmentRequest> searchEmployee(String text) {
    String term = Validation.text(text, "ФИО", 120).toLowerCase(Locale.ROOT);
    Set<Long> ids =
        users.all().stream()
            .filter(u -> u.getFullName().toLowerCase(Locale.ROOT).contains(term))
            .map(User::getId)
            .collect(Collectors.toSet());
    return all().stream().filter(q -> ids.contains(q.getUserId())).toList();
  }

  public List<EquipmentRequest> filterStatus(RequestStatus status) {
    return all().stream().filter(q -> q.getStatus() == status).toList();
  }

  public List<EquipmentRequest> filterType(EquipmentType type) {
    return all().stream().filter(q -> q.getEquipmentType() == type).toList();
  }

  public List<EquipmentRequest> sorted(boolean byQuantity) {
    Comparator<EquipmentRequest> comparator =
        byQuantity
            ? Comparator.comparingInt(EquipmentRequest::getQuantity)
            : Comparator.comparing(EquipmentRequest::getCreatedAt);
    return all().stream().sorted(comparator.thenComparingLong(EquipmentRequest::getId)).toList();
  }

  public Map<String, Long> statistics() {
    List<EquipmentRequest> list = all();
    Map<String, Long> result = new LinkedHashMap<>();
    result.put("Сотрудников", (long) users.all().size());
    result.put("Всего заявок", (long) list.size());
    result.put("Запрошено единиц", list.stream().mapToLong(EquipmentRequest::getQuantity).sum());
    for (RequestStatus s : RequestStatus.values())
      result.put(s.getLabel(), list.stream().filter(q -> q.getStatus() == s).count());
    return result;
  }
}
