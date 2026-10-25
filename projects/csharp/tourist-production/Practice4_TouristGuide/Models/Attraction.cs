namespace Practice4_TouristGuide.Models;

/// <summary>
/// Модель достопримечательности
/// </summary>
public class Attraction
{
    /// <summary>Уникальный идентификатор достопримечательности</summary>
    public int Id { get; set; }

    /// <summary>Название достопримечательности</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Краткое описание</summary>
    public string ShortDescription { get; set; } = string.Empty;

    /// <summary>Полная история/описание</summary>
    public string History { get; set; } = string.Empty;

    /// <summary>Путь к фотографии</summary>
    public string? PhotoUrl { get; set; }

    /// <summary>Часы работы</summary>
    public string? WorkingHours { get; set; }

    /// <summary>Стоимость посещения (null если бесплатно)</summary>
    public decimal? EntryFee { get; set; }

    /// <summary>ID города (внешний ключ)</summary>
    public int CityId { get; set; }

    /// <summary>Навигационное свойство — город</summary>
    public City City { get; set; } = null!;
}
