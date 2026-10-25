using System.Windows;
using LibraryManager.Data;
using LibraryManager.Models;

namespace LibraryManager.Windows;

/// <summary>
/// Окно добавления/редактирования книги
/// </summary>
public partial class BookWindow : Window
{
    private readonly LibraryContext _context;
    private readonly Book? _editingBook;
    private readonly bool _isEditMode;

    /// <summary>
    /// Конструктор для добавления новой книги
    /// </summary>
    public BookWindow(LibraryContext context)
    {
        InitializeComponent();
        _context = context;
        _editingBook = null;
        _isEditMode = false;
        
        LoadComboBoxes();
        TitleTextBlock.Text = "📖 Добавление книги";
        YearInput.Text = DateTime.Now.Year.ToString();
        QuantityInput.Text = "1";
    }

    /// <summary>
    /// Конструктор для редактирования существующей книги
    /// </summary>
    public BookWindow(LibraryContext context, Book book)
    {
        InitializeComponent();
        _context = context;
        _editingBook = book;
        _isEditMode = true;
        
        LoadComboBoxes();
        LoadBookData();
        TitleTextBlock.Text = "✏️ Редактирование книги";
    }

    /// <summary>
    /// Загрузка списков авторов и жанров
    /// </summary>
    private void LoadComboBoxes()
    {
        AuthorComboBox.ItemsSource = _context.Authors.ToList();
        GenreComboBox.ItemsSource = _context.Genres.ToList();
    }

    /// <summary>
    /// Загрузка данных книги для редактирования
    /// </summary>
    private void LoadBookData()
    {
        if (_editingBook == null) return;

        TitleInput.Text = _editingBook.Title;
        YearInput.Text = _editingBook.PublishYear.ToString();
        IsbnInput.Text = _editingBook.ISBN;
        QuantityInput.Text = _editingBook.QuantityInStock.ToString();

        // Выбираем автора и жанр в ComboBox
        AuthorComboBox.SelectedItem = _context.Authors.FirstOrDefault(a => a.Id == _editingBook.AuthorId);
        GenreComboBox.SelectedItem = _context.Genres.FirstOrDefault(g => g.Id == _editingBook.GenreId);
    }

    /// <summary>
    /// Сохранение книги
    /// </summary>
    private void Save_Click(object sender, RoutedEventArgs e)
    {
        // Валидация
        if (string.IsNullOrWhiteSpace(TitleInput.Text))
        {
            MessageBox.Show("Введите название книги", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            TitleInput.Focus();
            return;
        }

        if (AuthorComboBox.SelectedItem == null)
        {
            MessageBox.Show("Выберите автора", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (GenreComboBox.SelectedItem == null)
        {
            MessageBox.Show("Выберите жанр", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!int.TryParse(YearInput.Text, out int year) || year < 1 || year > DateTime.Now.Year + 1)
        {
            MessageBox.Show("Введите корректный год издания", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            YearInput.Focus();
            return;
        }

        if (!int.TryParse(QuantityInput.Text, out int quantity) || quantity < 0)
        {
            MessageBox.Show("Введите корректное количество (0 или больше)", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Warning);
            QuantityInput.Focus();
            return;
        }

        try
        {
            var selectedAuthor = (Author)AuthorComboBox.SelectedItem;
            var selectedGenre = (Genre)GenreComboBox.SelectedItem;

            if (_isEditMode && _editingBook != null)
            {
                // Редактирование существующей книги
                _editingBook.Title = TitleInput.Text.Trim();
                _editingBook.AuthorId = selectedAuthor.Id;
                _editingBook.GenreId = selectedGenre.Id;
                _editingBook.PublishYear = year;
                _editingBook.ISBN = IsbnInput.Text.Trim();
                _editingBook.QuantityInStock = quantity;
            }
            else
            {
                // Добавление новой книги
                var newBook = new Book
                {
                    Title = TitleInput.Text.Trim(),
                    AuthorId = selectedAuthor.Id,
                    GenreId = selectedGenre.Id,
                    PublishYear = year,
                    ISBN = IsbnInput.Text.Trim(),
                    QuantityInStock = quantity
                };
                _context.Books.Add(newBook);
            }

            _context.SaveChanges();
            DialogResult = true;
            Close();
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Ошибка сохранения: {ex.Message}", "Ошибка", 
                MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    /// <summary>
    /// Отмена и закрытие окна
    /// </summary>
    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}
