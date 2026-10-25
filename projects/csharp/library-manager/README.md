# 📚 LibraryManager - Управление библиотекой книг

WPF приложение для управления библиотекой с использованием Entity Framework Core.

**Дисциплина:** Программирование корпоративных систем  
**Практика №1**  
**РТУ МИРЭА**

---

## 📋 Описание проекта

Приложение для управления небольшой библиотекой, реализующее:
- Три сущности: **Book**, **Author**, **Genre**
- Связи один-ко-многим между сущностями
- CRUD операции для всех сущностей
- Поиск и фильтрация книг
- Графический интерфейс на WPF

---

## 🚀 Как запустить проект

### 1. Создание проекта в Visual Studio

1. Откройте **Visual Studio 2022**
2. Создайте новый проект: `File → New → Project`
3. Выберите **WPF Application** (.NET)
4. Назовите проект `LibraryManager`
5. Выберите **.NET 8.0** (или 6.0/7.0)

### 2. Установка NuGet пакетов

Откройте **Package Manager Console** (`Tools → NuGet Package Manager → Package Manager Console`) и выполните:

```powershell
Install-Package Microsoft.EntityFrameworkCore.SqlServer
Install-Package Microsoft.EntityFrameworkCore.Tools
```

Или через GUI: `Project → Manage NuGet Packages → Browse`

### 3. Добавление файлов

Создайте структуру папок и скопируйте файлы из этого проекта:

```
LibraryManager/
├── Models/
│   ├── Author.cs
│   ├── Genre.cs
│   └── Book.cs
├── Data/
│   └── LibraryContext.cs
├── Windows/
│   ├── MainWindow.xaml
│   ├── MainWindow.xaml.cs
│   ├── BookWindow.xaml
│   ├── BookWindow.xaml.cs
│   ├── AuthorsWindow.xaml
│   ├── AuthorsWindow.xaml.cs
│   ├── GenresWindow.xaml
│   └── GenresWindow.xaml.cs
├── App.xaml
└── App.xaml.cs
```

### 4. Настройка строки подключения

В файле `Data/LibraryContext.cs` измените строку подключения при необходимости:

```csharp
optionsBuilder.UseSqlServer(
    @"Server=(localdb)\mssqllocaldb;Database=LibraryDB;Trusted_Connection=True;");
```

### 5. Создание миграции и базы данных

В **Package Manager Console** выполните:

```powershell
Add-Migration InitialCreate
Update-Database
```

### 6. Запуск приложения

Нажмите `F5` или `Ctrl+F5` для запуска.

---

## 📊 Структура базы данных

### Таблица Authors
| Поле | Тип | Описание |
|------|-----|----------|
| Id | int | Первичный ключ |
| FirstName | nvarchar(100) | Имя автора |
| LastName | nvarchar(100) | Фамилия автора |
| BirthDate | datetime | Дата рождения |
| Country | nvarchar(100) | Страна |

### Таблица Genres
| Поле | Тип | Описание |
|------|-----|----------|
| Id | int | Первичный ключ |
| Name | nvarchar(100) | Название жанра |
| Description | nvarchar(500) | Описание |

### Таблица Books
| Поле | Тип | Описание |
|------|-----|----------|
| Id | int | Первичный ключ |
| Title | nvarchar(200) | Название книги |
| PublishYear | int | Год издания |
| ISBN | nvarchar(20) | ISBN номер |
| QuantityInStock | int | Количество в наличии |
| AuthorId | int | FK на Authors |
| GenreId | int | FK на Genres |

### Связи
- **Book → Author**: Один-ко-многим (у автора много книг)
- **Book → Genre**: Один-ко-многим (в жанре много книг)

---

## ✅ Реализованный функционал

### Сущности и связи
- [x] Создана сущность Book
- [x] Создана сущность Author
- [x] Создана сущность Genre
- [x] Настроена связь Book → Author (один-ко-многим)
- [x] Настроена связь Book → Genre (один-ко-многим)

### База данных (Fluent API)
- [x] Определены первичные ключи
- [x] Настроены обязательные поля
- [x] Установлены ограничения на длину строковых полей
- [x] Настроено каскадное удаление

### WPF Интерфейс
- [x] Главное окно с DataGrid для отображения книг
- [x] Панель фильтрации по жанру и автору
- [x] Кнопки добавления, редактирования и удаления книг
- [x] Окно добавления/редактирования книги
- [x] Окно управления авторами
- [x] Окно управления жанрами

### Функционал
- [x] CRUD операции для всех сущностей
- [x] Поиск книг по названию
- [x] Фильтрация книг по автору и жанру
- [x] Отображение количества книг в наличии
- [x] Выбор автора и жанра из списка при добавлении книги

---

## 📝 Примечания

- Приложение использует **LocalDB** — встроенную версию SQL Server
- При первом запуске база данных создаётся автоматически с тестовыми данными
- Каскадное удаление: при удалении автора/жанра удаляются все связанные книги

---

## 👨‍💻 Автор

Студент группы ЭФБО-18-24  
РТУ МИРЭА, 2026
