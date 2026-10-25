# Практические занятия №4 и №5
## Программирование корпоративных систем | МИРЭА | Яковлев М.С. |
## Хачатрян Давид Каренович  ЭФБО-18-24
---

## Практика №4 — Туристический путеводитель

**Стек:** ASP.NET Core 8 MVC · Entity Framework Core 8 (SQLite) · Bootstrap 5

### Запуск
```bash
cd Practice4_TouristGuide
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
# → https://localhost:5000
```

### Функционал
- Список городов с поиском по названию
- Карточки городов: название, регион, население, история, герб, фото
- Список достопримечательностей для каждого города с фото
- Страница достопримечательности: история, часы работы, стоимость входа
- CRUD: города и достопримечательности

---

## Практика №5 — Производственная система

**Стек:** ASP.NET Core 8 MVC + Web API · Entity Framework Core 8 (SQLite) · Bootstrap 5

### Запуск
```bash
cd Practice5_ProductionSystem
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
# → https://localhost:5000
```

### Формула расчёта времени
```
Время (мин) = (Количество × ВремяНаЕдиницу) / КоэффЭффективности
```

### API эндпоинты
| Метод | URL | Описание |
|-------|-----|----------|
| GET | /api/materials?low_stock=true | Материалы с низким запасом |
| PUT | /api/materials/{id}/stock | Обновить количество |
| GET | /api/products/{id}/materials | Материалы продукта |
| GET | /api/lines?available=true | Доступные линии |
| GET | /api/calculate/production?product_id=1&quantity=10 | Расчёт времени |
