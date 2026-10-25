namespace LibraryManager.Models;

/// <summary>
/// Сущность "Автор" - представляет автора книги
/// </summary>
public class Author
{
    public int Id { get; set; }
    
    /// <summary>
    /// Имя автора
    /// </summary>
    public string FirstName { get; set; } = string.Empty;
    
    /// <summary>
    /// Фамилия автора
    /// </summary>
    public string LastName { get; set; } = string.Empty;
    
    /// <summary>
    /// Дата рождения
    /// </summary>
    public DateTime? BirthDate { get; set; }
    
    /// <summary>
    /// Страна
    /// </summary>
    public string? Country { get; set; }
    
    /// <summary>
    /// Навигационное свойство - коллекция книг автора
    /// </summary>
    public virtual ICollection<Book> Books { get; set; } = new List<Book>();
    
    /// <summary>
    /// Полное имя автора для отображения
    /// </summary>
    public string FullName => $"{FirstName} {LastName}";
    
    public override string ToString() => FullName;
}
