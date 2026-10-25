using System.ComponentModel.DataAnnotations;

namespace BlazorShop.Shared;

/// <summary>
/// Модель товара интернет-магазина.
/// Используется одновременно как Entity для EF Core и как DTO для передачи между клиентом и сервером.
/// </summary>
public class Product
{
    /// <summary>Уникальный идентификатор товара (первичный ключ).</summary>
    public int Id { get; set; }

    /// <summary>Наименование товара.</summary>
    [Required(ErrorMessage = "Укажите наименование товара")]
    [StringLength(150, ErrorMessage = "Наименование не должно превышать 150 символов")]
    public string Name { get; set; } = string.Empty;

    /// <summary>Краткое описание товара.</summary>
    [StringLength(500, ErrorMessage = "Описание не должно превышать 500 символов")]
    public string Description { get; set; } = string.Empty;

    /// <summary>Категория товара (например, "Электроника", "Книги").</summary>
    [Required(ErrorMessage = "Укажите категорию")]
    [StringLength(80)]
    public string Category { get; set; } = string.Empty;

    /// <summary>Цена за единицу товара в рублях.</summary>
    [Range(0.01, 1_000_000, ErrorMessage = "Цена должна быть от 0,01 до 1 000 000 ₽")]
    public decimal Price { get; set; }

    /// <summary>Количество товара на складе.</summary>
    [Range(0, int.MaxValue, ErrorMessage = "Количество не может быть отрицательным")]
    public int Stock { get; set; }

    /// <summary>Дата добавления товара в каталог.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
