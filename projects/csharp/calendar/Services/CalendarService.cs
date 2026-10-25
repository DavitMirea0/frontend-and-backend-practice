using System.Text.Json;
using CalendarApp.Models;
using Microsoft.Extensions.Logging;

namespace CalendarApp.Services;

public class CalendarService
{
    private readonly ILogger<CalendarService> _logger;
    private readonly Dictionary<DateTime, List<CalendarEvent>> _events;
    private readonly string _dataFilePath;
    private readonly JsonSerializerOptions _jsonOptions;

    public CalendarService(ILogger<MainCalendarForm> mainLogger)
    {
        using var loggerFactory = LoggerFactory.Create(builder =>
        {
            builder.AddConsole();
            builder.SetMinimumLevel(LogLevel.Information);
        });

        _logger = loggerFactory.CreateLogger<CalendarService>();
        _events = new Dictionary<DateTime, List<CalendarEvent>>();

        _dataFilePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                                    "CalendarApp", "events.json");

        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
        };

        InitializeDataDirectory();
        LoadEventsAsync().GetAwaiter().GetResult();
    }

    public async Task<bool> AddEventAsync(CalendarEvent calendarEvent)
    {
        try
        {
            var date = calendarEvent.Date.Date;

            if (!_events.ContainsKey(date))
            {
                _events[date] = new List<CalendarEvent>();
            }

            _events[date].Add(calendarEvent);
            await SaveEventsAsync();

            _logger.LogInformation("Добавлено событие: {Title}", calendarEvent.Title);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при добавлении события");
            return false;
        }
    }

    public IReadOnlyList<CalendarEvent> GetEventsForDate(DateTime date)
    {
        var dateKey = date.Date;
        return _events.TryGetValue(dateKey, out var events)
            ? events.AsReadOnly()
            : Array.Empty<CalendarEvent>();
    }

    public IReadOnlyDictionary<DateTime, IReadOnlyList<CalendarEvent>> GetEventsForMonth(int year, int month)
    {
        var result = new Dictionary<DateTime, IReadOnlyList<CalendarEvent>>();
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        foreach (var kvp in _events.Where(e => e.Key >= startDate && e.Key <= endDate))
        {
            result[kvp.Key] = kvp.Value.AsReadOnly();
        }

        return result;
    }

    public IReadOnlyDictionary<DateTime, IReadOnlyList<CalendarEvent>> GetEventsForWeek(DateTime weekStart)
    {
        var result = new Dictionary<DateTime, IReadOnlyList<CalendarEvent>>();

        for (int i = 0; i < 7; i++)
        {
            var date = weekStart.AddDays(i).Date;
            var events = GetEventsForDate(date);
            if (events.Count > 0)
            {
                result[date] = events;
            }
        }

        return result;
    }

    public async Task<bool> RemoveEventAsync(Guid eventId)
    {
        try
        {
            foreach (var dateEvents in _events.Values)
            {
                var eventToRemove = dateEvents.FirstOrDefault(e => e.Id == eventId);
                if (eventToRemove != null)
                {
                    dateEvents.Remove(eventToRemove);
                    await SaveEventsAsync();

                    _logger.LogInformation("Удалено событие: {Title}", eventToRemove.Title);
                    return true;
                }
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при удалении события");
            return false;
        }
    }

    public async Task<bool> ClearAllEventsAsync()
    {
        try
        {
            _events.Clear();
            await SaveEventsAsync();

            _logger.LogInformation("Все события очищены");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при очистке событий");
            return false;
        }
    }

    public async Task<bool> ExportEventsAsync(string filePath, int year, int month)
    {
        try
        {
            var monthEvents = GetEventsForMonth(year, month);
            var content = GenerateExportContent(monthEvents, year, month);

            await File.WriteAllTextAsync(filePath, content, System.Text.Encoding.UTF8);

            _logger.LogInformation("События экспортированы в: {FilePath}", filePath);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при экспорте событий");
            return false;
        }
    }

    public (int TotalEvents, int ThisMonth, int NextWeek) GetStatistics()
    {
        var totalEvents = _events.Values.Sum(list => list.Count);

        var now = DateTime.Now;
        var thisMonthEvents = GetEventsForMonth(now.Year, now.Month).Values.Sum(list => list.Count);

        var nextWeekStart = now.Date.AddDays(1);
        var nextWeekEnd = nextWeekStart.AddDays(7);
        var nextWeekEvents = _events
            .Where(kvp => kvp.Key >= nextWeekStart && kvp.Key < nextWeekEnd)
            .Sum(kvp => kvp.Value.Count);

        return (totalEvents, thisMonthEvents, nextWeekEvents);
    }

    private void InitializeDataDirectory()
    {
        try
        {
            var directory = Path.GetDirectoryName(_dataFilePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
                _logger.LogInformation("Создана папка для данных: {Directory}", directory);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при создании папки для данных");
        }
    }

    private async Task LoadEventsAsync()
    {
        try
        {
            if (!File.Exists(_dataFilePath))
            {
                _logger.LogInformation("Файл данных не найден, создается новый");
                return;
            }

            var jsonData = await File.ReadAllTextAsync(_dataFilePath);
            var eventsData = JsonSerializer.Deserialize<Dictionary<string, List<CalendarEvent>>>(jsonData, _jsonOptions);

            if (eventsData != null)
            {
                _events.Clear();
                foreach (var kvp in eventsData)
                {
                    if (DateTime.TryParse(kvp.Key, out var date))
                    {
                        _events[date.Date] = kvp.Value;
                    }
                }

                _logger.LogInformation("Загружено {Count} дат с событиями", _events.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при загрузке событий");
        }
    }

    private async Task SaveEventsAsync()
    {
        try
        {
            var eventsData = _events.ToDictionary(
                kvp => kvp.Key.ToString("yyyy-MM-dd"),
                kvp => kvp.Value
            );

            var jsonData = JsonSerializer.Serialize(eventsData, _jsonOptions);
            await File.WriteAllTextAsync(_dataFilePath, jsonData, System.Text.Encoding.UTF8);

            _logger.LogDebug("События сохранены в файл");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при сохранении событий");
        }
    }

    private static string GenerateExportContent(IReadOnlyDictionary<DateTime, IReadOnlyList<CalendarEvent>> monthEvents,
                                              int year, int month)
    {
        var monthName = System.Globalization.CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month);
        var content = new System.Text.StringBuilder();

        content.AppendLine($"Календарь - {monthName} {year}");
        content.AppendLine(new string('=', 50));
        content.AppendLine();

        if (monthEvents.Count == 0)
        {
            content.AppendLine("В этом месяце нет событий.");
            return content.ToString();
        }

        content.AppendLine("События месяца:");
        content.AppendLine();

        foreach (var (date, events) in monthEvents.OrderBy(kvp => kvp.Key))
        {
            content.AppendLine($"{date:dd.MM.yyyy} ({date:dddd}):");

            foreach (var evt in events)
            {
                var timeInfo = evt.IsAllDay ? "Весь день" :
                              evt.StartTime.HasValue ? $"{evt.StartTime:HH:mm}" : "";

                content.AppendLine($"  • {evt.Title}");
                if (!string.IsNullOrEmpty(evt.Description))
                {
                    content.AppendLine($"    {evt.Description}");
                }
                if (!string.IsNullOrEmpty(timeInfo))
                {
                    content.AppendLine($"    Время: {timeInfo}");
                }
                content.AppendLine($"    Категория: {evt.Category}");
            }
            content.AppendLine();
        }

        var totalEvents = monthEvents.Values.Sum(list => list.Count);
        content.AppendLine($"Всего событий: {totalEvents}");
        content.AppendLine($"Экспортировано: {DateTime.Now:dd.MM.yyyy HH:mm}");

        return content.ToString();
    }
}