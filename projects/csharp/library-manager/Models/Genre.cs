namespace LibraryManager.Models;

/// <summary>
/// Сущность "Жанр" - представляет жанр книги
/// </summary>
public class Genre
{
    public int Id { get; set; }
    
    /// <summary>
    /// Название жанра
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Описание жанра
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Навигационное свойство - коллекция книг данного жанра
    /// </summary>
    public virtual ICollection<Book> Books { get; set; } = new List<Book>();
    
    public override string ToString() => Name;
}
