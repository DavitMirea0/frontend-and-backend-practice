using System.Text.Json.Serialization;

namespace CalendarApp.Models;

/// <summary>
/// Модель события календаря с поддержкой сериализации JSON
/// </summary>
public record CalendarEvent
{
    [JsonPropertyName("id")]
    public Guid Id { get; init; } = Guid.NewGuid();
    
    [JsonPropertyName("date")]
    public DateTime Date { get; init; }
    
    [JsonPropertyName("title")]
    public required string Title { get; init; }
    
    [JsonPropertyName("description")]
    public string? Description { get; init; }
    
    [JsonPropertyName("color")]
    public string ColorHex { get; init; } = "#ADD8E6";
    
    [JsonPropertyName("isAllDay")]
    public bool IsAllDay { get; init; } = true;
    
    [JsonPropertyName("startTime")]
    public TimeOnly? StartTime { get; init; }
    
    [JsonPropertyName("endTime")]
    public TimeOnly? EndTime { get; init; }
    
    [JsonPropertyName("category")]
    public EventCategory Category { get; init; } = EventCategory.Personal;
    
    [JsonPropertyName("reminder")]
    public TimeSpan? Reminder { get; init; }
    
    [JsonPropertyName("isRecurring")]
    public bool IsRecurring { get; init; } = false;
    
    [JsonPropertyName("recurrencePattern")]
    public RecurrencePattern? RecurrencePattern { get; init; }
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; init; } = DateTime.Now;
    
    [JsonPropertyName("modifiedAt")]
    public DateTime ModifiedAt { get; init; } = DateTime.Now;
    
    /// <summary>
    /// Получает цвет как объект Color
    /// </summary>
    [JsonIgnore]
    public Color Color => ColorTranslator.FromHtml(ColorHex);
    
    /// <summary>
    /// Создает копию события с измененной датой
    /// </summary>
    public CalendarEvent WithDate(DateTime newDate) => this with { Date = newDate };
    
    /// <summary>
    /// Создает копию события с новым временем модификации
    /// </summary>
    public CalendarEvent WithModified() => this with { ModifiedAt = DateTime.Now };
}

/// <summary>
/// Категории событий
/// </summary>
public enum EventCategory
{
    Personal,
    Work,
    Holiday,
    Birthday,
    Meeting,
    Appointment,
    Other
}

/// <summary>
/// Паттерны повторения событий
/// </summary>
public enum RecurrencePattern
{
    Daily,
    Weekly,
    Monthly,
    Yearly
}