namespace LibraryManager.Models;

/// <summary>
/// Сущность "Книга" - представляет книгу в библиотеке
/// </summary>
public class Book
{
    public int Id { get; set; }
    
    /// <summary>
    /// Название книги
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Год публикации
    /// </summary>
    public int PublishYear { get; set; }
    
    /// <summary>
    /// ISBN - международный стандартный книжный номер
    /// Пример: 978-5-699-12014-7
    /// </summary>
    public string? ISBN { get; set; }
    
    /// <summary>
    /// Количество экземпляров в наличии
    /// </summary>
    public int QuantityInStock { get; set; }
    
    /// <summary>
    /// Внешний ключ на автора
    /// </summary>
    public int AuthorId { get; set; }
    
    /// <summary>
    /// Навигационное свойство - автор книги (связь один-ко-многим)
    /// </summary>
    public virtual Author? Author { get; set; }
    
    /// <summary>
    /// Внешний ключ на жанр
    /// </summary>
    public int GenreId { get; set; }
    
    /// <summary>
    /// Навигационное свойство - жанр книги (связь один-ко-многим)
    /// </summary>
    public virtual Genre? Genre { get; set; }
}
