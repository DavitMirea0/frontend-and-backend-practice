using System.Windows;
using System.Windows.Controls;
using Microsoft.EntityFrameworkCore;
using LibraryManager.Data;
using LibraryManager.Models;

namespace LibraryManager.Windows;

/// <summary>
/// Логика взаимодействия для MainWindow.xaml
/// Главное окно приложения управления библиотекой
/// </summary>
public partial class MainWindow : Window
{
    private LibraryContext _context;
    private List<Book> _allBooks;

    public MainWindow()
    {
        InitializeComponent();
        _context = new LibraryContext();
        _allBooks = new List<Book>();
        
        // Убеждаемся, что база данных создана
        _context.Database.EnsureCreated();
        
        LoadData();
    }

    /// <summary>
    /// Загрузка всех данных из базы
    /// </summary>
    private void LoadData()
    {
        try
        {
            // Загружаем книги с авторами и жанрами
            _allBooks = _context.Books
                .Include(b => b.Author)
                .Include(b => b.Genre)
                .ToList();

            // Загружаем авторов для фильтра
            var authors = _context.Authors.ToList();
            AuthorFilterComboBox.ItemsSource = new List<Author> { new Author { Id = 0, FirstName = "Все", LastName = "авторы" } }
                .Concat(authors).ToList();
            AuthorFilterComboBox.SelectedIndex = 0;

            // Загружаем жанры для фильтра
            var genres = _context.Genres.ToList();
            GenreFilterComboBox.ItemsSource = new List<Genre> { new Genre { Id = 0, Name = "Все жанры" } }
                .Concat(genres).ToList();
            GenreFilterComboBox.SelectedIndex = 0;

            // Отображаем книги
            ApplyFilters();
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Ошибка загрузки данных: {ex.Message}", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    /// <summary>
    /// Применение фильтров к списку книг
    /// </summary>
    private void ApplyFilters()
    {
        var filtered = _allBooks.AsEnumerable();

        // Фильтр по названию (поиск)
        string searchText = SearchTextBox.Text?.Trim().ToLower() ?? "";
        if (!string.IsNullOrEmpty(searchText))
        {
            filtered = filtered.Where(b => 
                b.Title.ToLower().Contains(searchText));
        }

        // Фильтр по автору
        if (AuthorFilterComboBox.SelectedItem is Author selectedAuthor && selectedAuthor.Id != 0)
        {
            filtered = filtered.Where(b => b.AuthorId == selectedAuthor.Id);
        }

        // Фильтр по жанру
        if (GenreFilterComboBox.SelectedItem is Genre selectedGenre && selectedGenre.Id != 0)
        {
            filtered = filtered.Where(b => b.GenreId == selectedGenre.Id);
        }

        var result = filtered.ToList();
        BooksDataGrid.ItemsSource = result;

        // Обновляем статистику
        int totalBooks = result.Sum(b => b.QuantityInStock);
        StatsTextBlock.Text = $"Найдено: {result.Count} книг(и) | Всего экземпляров: {totalBooks}";
    }

    /// <summary>
    /// Обработчик изменения текста поиска
    /// </summary>
    private void SearchTextBox_TextChanged(object sender, TextChangedEventArgs e)
    {
        ApplyFilters();
    }

    /// <summary>
    /// Обработчик изменения фильтров
    /// </summary>
    private void FilterComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (IsLoaded) // Проверяем, что окно загружено
        {
            ApplyFilters();
        }
    }

    /// <summary>
    /// Сброс всех фильтров
    /// </summary>
    private void ResetFilters_Click(object sender, RoutedEventArgs e)
    {
        SearchTextBox.Text = "";
        AuthorFilterComboBox.SelectedIndex = 0;
        GenreFilterComboBox.SelectedIndex = 0;
        ApplyFilters();
    }

    /// <summary>
    /// Добавление новой книги
    /// </summary>
    private void AddBook_Click(object sender, RoutedEventArgs e)
    {
        var bookWindow = new BookWindow(_context);
        if (bookWindow.ShowDialog() == true)
        {
            RefreshData();
        }
    }

    /// <summary>
    /// Редактирование выбранной книги
    /// </summary>
    private void EditBook_Click(object sender, RoutedEventArgs e)
    {
        if (BooksDataGrid.SelectedItem is Book selectedBook)
        {
            var bookWindow = new BookWindow(_context, selectedBook);
            if (bookWindow.ShowDialog() == true)
            {
                RefreshData();
            }
        }
        else
        {
            MessageBox.Show("Выберите книгу для редактирования", "Внимание", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    /// <summary>
    /// Удаление выбранной книги
    /// </summary>
    private void DeleteBook_Click(object sender, RoutedEventArgs e)
    {
        if (BooksDataGrid.SelectedItem is Book selectedBook)
        {
            var result = MessageBox.Show(
                $"Вы уверены, что хотите удалить книгу \"{selectedBook.Title}\"?",
                "Подтверждение удаления",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);

            if (result == MessageBoxResult.Yes)
            {
                try
                {
                    _context.Books.Remove(selectedBook);
                    _context.SaveChanges();
                    RefreshData();
                    MessageBox.Show("Книга успешно удалена", "Успех", 
                        MessageBoxButton.OK, MessageBoxImage.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Ошибка удаления: {ex.Message}", "Ошибка", 
                        MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }
        else
        {
            MessageBox.Show("Выберите книгу для удаления", "Внимание", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    /// <summary>
    /// Открытие окна управления авторами
    /// </summary>
    private void ManageAuthors_Click(object sender, RoutedEventArgs e)
    {
        var authorsWindow = new AuthorsWindow(_context);
        authorsWindow.ShowDialog();
        RefreshData(); // Обновляем данные после закрытия
    }

    /// <summary>
    /// Открытие окна управления жанрами
    /// </summary>
    private void ManageGenres_Click(object sender, RoutedEventArgs e)
    {
        var genresWindow = new GenresWindow(_context);
        genresWindow.ShowDialog();
        RefreshData(); // Обновляем данные после закрытия
    }

    /// <summary>
    /// Обновление данных
    /// </summary>
    private void Refresh_Click(object sender, RoutedEventArgs e)
    {
        RefreshData();
    }

    /// <summary>
    /// Перезагрузка данных из базы
    /// </summary>
    private void RefreshData()
    {
        // Пересоздаём контекст для получения свежих данных
        _context.Dispose();
        _context = new LibraryContext();
        LoadData();
    }

    /// <summary>
    /// Освобождение ресурсов при закрытии окна
    /// </summary>
    protected override void OnClosed(EventArgs e)
    {
        _context?.Dispose();
        base.OnClosed(e);
    }
}
