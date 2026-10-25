# 🛒 BlazorShop — Практика №6

Клиент-серверное приложение для управления товарами интернет-магазина на **Blazor WebAssembly** с **ASP.NET Core 8** и **Entity Framework Core 8**.

**Дисциплина:** Программирование корпоративных систем
**Преподаватель:** Яковлев Михаил Сергеевич
**РТУ МИРЭА · ИПТИП · ЭФБО-18-24 · 2 семестр 2025–2026**

---

## 📋 Что реализовано

### Архитектура (3 проекта в одном решении)

| Проект | Тип | Назначение |
|--------|-----|------------|
| `BlazorShop.Server` | ASP.NET Core 8 Web Host | REST API + хостинг WASM-клиента + EF Core/SQLite |
| `BlazorShop.Client` | Blazor WebAssembly | Браузерный UI на C# |
| `BlazorShop.Shared` | Class Library | Общая модель `Product` (DTO и Entity одновременно) |

### REST API (`ProductsController`)

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/products` | Получить список всех товаров |
| `GET` | `/api/products/{id}` | Получить один товар |
| `POST` | `/api/products` | Добавить новый товар |
| `PUT` | `/api/products/{id}` | Изменить существующий товар |
| `DELETE` | `/api/products/{id}` | Удалить товар |

### Интерфейс (Blazor WebAssembly)

- ✅ **Страница отображения товаров** — таблица с поиском и фильтрацией
- ✅ **Форма добавления нового товара** — модальное окно с валидацией
- ✅ **Форма изменения товара** — то же модальное окно в режиме редактирования
- ✅ **Удаление с подтверждением** — отдельный диалог «Удалить?»
- ✅ **Переключатель темы оформления** (светлая ☀️ / тёмная 🌙)
- ✅ Тема сохраняется в LocalStorage между сессиями
- ✅ Подсветка низкого остатка (< 5 единиц)
- ✅ Валидация на основе DataAnnotations

### База данных

- **SQLite** (файл `blazorshop.db`) создаётся автоматически при первом запуске
- Стартовый набор: **6 товаров** (наушники, клавиатуры, книги, монитор)
- EF Core с `EnsureCreated()` — миграции не обязательны

---

## 🚀 Запуск

### Требования

- **.NET 8 SDK** ([скачать](https://dotnet.microsoft.com/download/dotnet/8.0))
- Visual Studio 2022 (17.8+) **или** VS Code + расширение C# Dev Kit

### Способ 1 — через Visual Studio

1. Открыть `BlazorShop.sln`
2. ПКМ на `BlazorShop.Server` → **Set as Startup Project**
3. Нажать **F5**
4. Браузер сам откроет `https://localhost:7001`

### Способ 2 — через командную строку

```bash
cd BlazorShop.Server
dotnet restore
dotnet run
```

Открыть в браузере: **https://localhost:7001**
Swagger UI с API: **https://localhost:7001/swagger**

### Проверка API в Swagger

Зайти на `/swagger`, развернуть `GET /api/products` → **Try it out** → **Execute**.
Должны вернуться 6 стартовых товаров.

---

## 🗂️ Структура проекта

```
BlazorShop/
├── BlazorShop.sln
│
├── BlazorShop.Shared/
│   ├── BlazorShop.Shared.csproj
│   └── Product.cs                       — модель товара с валидацией
│
├── BlazorShop.Server/
│   ├── BlazorShop.Server.csproj
│   ├── Program.cs                       — DI, конвейер, EF
│   ├── appsettings.json                 — строка подключения
│   ├── Properties/launchSettings.json
│   ├── Pages/_Host.cshtml
│   ├── Controllers/
│   │   └── ProductsController.cs        — GET/POST/PUT/DELETE
│   └── Data/
│       └── AppDbContext.cs              — EF контекст + seed
│
└── BlazorShop.Client/
    ├── BlazorShop.Client.csproj
    ├── Program.cs                       — DI клиента, HttpClient
    ├── App.razor                        — маршрутизация
    ├── _Imports.razor
    ├── Layout/
    │   └── MainLayout.razor             — шапка + переключатель темы
    ├── Pages/
    │   └── Products.razor               — таблица + формы + удаление
    ├── Services/
    │   ├── ProductService.cs            — обёртка над HttpClient
    │   └── ThemeService.cs              — управление темой
    └── wwwroot/
        ├── index.html
        └── css/app.css                  — стили обеих тем
```

---

## 🎨 Темы оформления

Переключатель в правом верхнем углу.

| Тема | Фон | Акцент |
|------|-----|--------|
| Светлая ☀️ | `#f5f7fa` | синий `#2563eb` |
| Тёмная 🌙 | `#0f172a` | синий `#3b82f6` |

Выбор сохраняется в `LocalStorage` (ключ `blazorshop-theme`) и подгружается при следующем визите.

---

## 🛠️ Соответствие техническому заданию

| Требование | Реализация |
|------------|------------|
| BlazorClient (WebAssembly) | `BlazorShop.Client` (Sdk `Microsoft.NET.Sdk.BlazorWebAssembly`) |
| BlazorServer (ASP.NET Core Host) | `BlazorShop.Server` хостит WASM + API |
| `GET /api/products` | `ProductsController.GetAll()` |
| `POST /api/products` | `ProductsController.Create()` |
| `DELETE /api/products` | `ProductsController.Delete(id)` |
| `PUT /api/products` | `ProductsController.Update(id)` |
| Страница отображения товаров | `Pages/Products.razor` — таблица |
| Форма добавления товара | модальное окно (`OpenCreateForm`) |
| Форма изменения товара | то же окно в режиме `_isEditMode = true` |
| Удаление с подтверждением | отдельный диалог `_productToDelete` |
| EF Core + БД | `AppDbContext` + SQLite |
| Переключатель тем (светлая/тёмная) | `ThemeService` + `MainLayout` |

---

## ❓ Возможные проблемы

**«Сертификат не доверяется»** при первом запуске HTTPS:
```bash
dotnet dev-certs https --trust
```

**Порт занят** — измените `applicationUrl` в `BlazorShop.Server/Properties/launchSettings.json`.

**Хочу пересоздать БД** — удалите файл `BlazorShop.Server/blazorshop.db` и перезапустите.

**Хочу использовать миграции вместо `EnsureCreated`:**
```bash
cd BlazorShop.Server
dotnet ef migrations add InitialCreate
dotnet ef database update
```
И в `Program.cs` замените `db.Database.EnsureCreated()` на `db.Database.Migrate()`.
