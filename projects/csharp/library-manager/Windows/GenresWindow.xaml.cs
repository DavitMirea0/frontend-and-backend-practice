using System.Windows;
using System.Windows.Controls;
using LibraryManager.Data;
using LibraryManager.Models;

namespace LibraryManager.Windows;

/// <summary>
/// Окно управления жанрами (CRUD операции)
/// </summary>
public partial class GenresWindow : Window
{
    private readonly LibraryContext _context;
    private Genre? _selectedGenre;

    public GenresWindow(LibraryContext context)
    {
        InitializeComponent();
        _context = context;
        LoadGenres();
    }

    /// <summary>
    /// Загрузка списка жанров
    /// </summary>
    private void LoadGenres()
    {
        GenresDataGrid.ItemsSource = _context.Genres.ToList();
    }

    /// <summary>
    /// Выбор жанра в таблице
    /// </summary>
    private void GenresDataGrid_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (GenresDataGrid.SelectedItem is Genre genre)
        {
            _selectedGenre = genre;
            NameInput.Text = genre.Name;
            DescriptionInput.Text = genre.Description;
        }
    }

    /// <summary>
    /// Добавление нового жанра
    /// </summary>
    private void Add_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateInput()) return;

        try
        {
            var newGenre = new Genre
            {
                Name = NameInput.Text.Trim(),
                Description = DescriptionInput.Text.Trim()
            };

            _context.Genres.Add(newGenre);
            _context.SaveChanges();
            
            LoadGenres();
            ClearForm();
            
            MessageBox.Show("Жанр успешно добавлен", "Успех", 
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Ошибка добавления: {ex.Message}", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    /// <summary>
    /// Сохранение изменений выбранного жанра
    /// </summary>
    private void Save_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedGenre == null)
        {
            MessageBox.Show("Выберите жанр для редактирования", "Внимание", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!ValidateInput()) return;

        try
        {
            _selectedGenre.Name = NameInput.Text.Trim();
            _selectedGenre.Description = DescriptionInput.Text.Trim();

            _context.SaveChanges();
            LoadGenres();
            
            MessageBox.Show("Жанр успешно обновлён", "Успех", 
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Ошибка сохранения: {ex.Message}", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    /// <summary>
    /// Удаление выбранного жанра
    /// </summary>
    private void Delete_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedGenre == null)
        {
            MessageBox.Show("Выберите жанр для удаления", "Внимание", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        // Проверяем, есть ли книги этого жанра
        var booksCount = _context.Books.Count(b => b.GenreId == _selectedGenre.Id);
        
        string message = booksCount > 0
            ? $"В жанре \"{_selectedGenre.Name}\" есть {booksCount} книг(и). При удалении жанра все книги этого жанра также будут удалены. Продолжить?"
            : $"Вы уверены, что хотите удалить жанр \"{_selectedGenre.Name}\"?";

        var result = MessageBox.Show(message, "Подтверждение удаления",
            MessageBoxButton.YesNo, MessageBoxImage.Question);

        if (result == MessageBoxResult.Yes)
        {
            try
            {
                _context.Genres.Remove(_selectedGenre);
                _context.SaveChanges();
                
                LoadGenres();
                ClearForm();
                
                MessageBox.Show("Жанр успешно удалён", "Успех", 
                    MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка удаления: {ex.Message}", "Ошибка", 
                    MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }

    /// <summary>
    /// Очистка формы
    /// </summary>
    private void Clear_Click(object sender, RoutedEventArgs e)
    {
        ClearForm();
    }

    /// <summary>
    /// Закрытие окна
    /// </summary>
    private void Close_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }

    /// <summary>
    /// Валидация введённых данных
    /// </summary>
    private bool ValidateInput()
    {
        if (string.IsNullOrWhiteSpace(NameInput.Text))
        {
            MessageBox.Show("Введите название жанра", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            NameInput.Focus();
            return false;
        }

        return true;
    }

    /// <summary>
    /// Очистка полей формы
    /// </summary>
    private void ClearForm()
    {
        _selectedGenre = null;
        GenresDataGrid.SelectedItem = null;
        NameInput.Text = "";
        DescriptionInput.Text = "";
    }
}
