namespace Practice4_TouristGuide.Models;

/// <summary>
/// Модель города для туристического путеводителя
/// </summary>
public class City
{
    /// <summary>Уникальный идентификатор города</summary>
    public int Id { get; set; }

    /// <summary>Название города</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Регион/область</summary>
    public string Region { get; set; } = string.Empty;

    /// <summary>Население</summary>
    public int Population { get; set; }

    /// <summary>История города</summary>
    public string History { get; set; } = string.Empty;

    /// <summary>Краткое описание</summary>
    public string ShortDescription { get; set; } = string.Empty;

    /// <summary>Путь к фотографии города</summary>
    public string? PhotoUrl { get; set; }

    /// <summary>Путь к изображению герба</summary>
    public string? CoatOfArmsUrl { get; set; }

    /// <summary>Список достопримечательностей города</summary>
    public ICollection<Attraction> Attractions { get; set; } = new List<Attraction>();
}
