using System.Windows;
using System.Windows.Controls;
using LibraryManager.Data;
using LibraryManager.Models;

namespace LibraryManager.Windows;

/// <summary>
/// Окно управления авторами (CRUD операции)
/// </summary>
public partial class AuthorsWindow : Window
{
    private readonly LibraryContext _context;
    private Author? _selectedAuthor;

    public AuthorsWindow(LibraryContext context)
    {
        InitializeComponent();
        _context = context;
        LoadAuthors();
    }

    /// <summary>
    /// Загрузка списка авторов
    /// </summary>
    private void LoadAuthors()
    {
        AuthorsDataGrid.ItemsSource = _context.Authors.ToList();
    }

    /// <summary>
    /// Выбор автора в таблице
    /// </summary>
    private void AuthorsDataGrid_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (AuthorsDataGrid.SelectedItem is Author author)
        {
            _selectedAuthor = author;
            FirstNameInput.Text = author.FirstName;
            LastNameInput.Text = author.LastName;
            BirthDatePicker.SelectedDate = author.BirthDate;
            CountryInput.Text = author.Country;
        }
    }

    /// <summary>
    /// Добавление нового автора
    /// </summary>
    private void Add_Click(object sender, RoutedEventArgs e)
    {
        if (!ValidateInput()) return;

        try
        {
            var newAuthor = new Author
            {
                FirstName = FirstNameInput.Text.Trim(),
                LastName = LastNameInput.Text.Trim(),
                BirthDate = BirthDatePicker.SelectedDate,
                Country = CountryInput.Text.Trim()
            };

            _context.Authors.Add(newAuthor);
            _context.SaveChanges();
            
            LoadAuthors();
            ClearForm();
            
            MessageBox.Show("Автор успешно добавлен", "Успех", 
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Ошибка добавления: {ex.Message}", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    /// <summary>
    /// Сохранение изменений выбранного автора
    /// </summary>
    private void Save_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedAuthor == null)
        {
            MessageBox.Show("Выберите автора для редактирования", "Внимание", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!ValidateInput()) return;

        try
        {
            _selectedAuthor.FirstName = FirstNameInput.Text.Trim();
            _selectedAuthor.LastName = LastNameInput.Text.Trim();
            _selectedAuthor.BirthDate = BirthDatePicker.SelectedDate;
            _selectedAuthor.Country = CountryInput.Text.Trim();

            _context.SaveChanges();
            LoadAuthors();
            
            MessageBox.Show("Автор успешно обновлён", "Успех", 
                MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Ошибка сохранения: {ex.Message}", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    /// <summary>
    /// Удаление выбранного автора
    /// </summary>
    private void Delete_Click(object sender, RoutedEventArgs e)
    {
        if (_selectedAuthor == null)
        {
            MessageBox.Show("Выберите автора для удаления", "Внимание", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        // Проверяем, есть ли книги у автора
        var booksCount = _context.Books.Count(b => b.AuthorId == _selectedAuthor.Id);
        
        string message = booksCount > 0
            ? $"У автора \"{_selectedAuthor.FullName}\" есть {booksCount} книг(и). При удалении автора все его книги также будут удалены. Продолжить?"
            : $"Вы уверены, что хотите удалить автора \"{_selectedAuthor.FullName}\"?";

        var result = MessageBox.Show(message, "Подтверждение удаления",
            MessageBoxButton.YesNo, MessageBoxImage.Question);

        if (result == MessageBoxResult.Yes)
        {
            try
            {
                _context.Authors.Remove(_selectedAuthor);
                _context.SaveChanges();
                
                LoadAuthors();
                ClearForm();
                
                MessageBox.Show("Автор успешно удалён", "Успех", 
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
        if (string.IsNullOrWhiteSpace(FirstNameInput.Text))
        {
            MessageBox.Show("Введите имя автора", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            FirstNameInput.Focus();
            return false;
        }

        if (string.IsNullOrWhiteSpace(LastNameInput.Text))
        {
            MessageBox.Show("Введите фамилию автора", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            LastNameInput.Focus();
            return false;
        }

        return true;
    }

    /// <summary>
    /// Очистка полей формы
    /// </summary>
    private void ClearForm()
    {
        _selectedAuthor = null;
        AuthorsDataGrid.SelectedItem = null;
        FirstNameInput.Text = "";
        LastNameInput.Text = "";
        BirthDatePicker.SelectedDate = null;
        CountryInput.Text = "";
    }
}
