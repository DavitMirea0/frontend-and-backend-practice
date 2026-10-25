using CalendarApp.Models;
using CalendarApp.Services;
using Microsoft.Extensions.Logging;

namespace CalendarApp;

public partial class WeekViewForm : Form
{
    private readonly DateTime _currentWeekStart;
    private readonly CalendarService _calendarService;
    private readonly ILogger _logger;

    public WeekViewForm(DateTime date, CalendarService calendarService, ILogger logger)
    {
        _calendarService = calendarService;
        _logger = logger;

        // Находим начало недели (понедельник)
        int daysFromMonday = ((int)date.DayOfWeek + 6) % 7;
        _currentWeekStart = date.AddDays(-daysFromMonday);

        InitializeComponent();
    }

    private void InitializeComponent()
    {
        Text = $"Неделя с {_currentWeekStart:dd.MM.yyyy} по {_currentWeekStart.AddDays(6):dd.MM.yyyy}";
        Size = new Size(900, 600);
        StartPosition = FormStartPosition.CenterParent;
        BackColor = Color.White;

        var weekPanel = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 7,
            RowCount = 2,
            CellBorderStyle = TableLayoutPanelCellBorderStyle.Single,
            BackColor = Color.White
        };

        // Настройка размеров
        for (int i = 0; i < 7; i++)
        {
            weekPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 14.28f));
        }
        weekPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, 50));
        weekPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

        // Заголовки дней
        string[] dayNames = { "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье" };

        var weekEvents = _calendarService.GetEventsForWeek(_currentWeekStart);

        for (int i = 0; i < 7; i++)
        {
            var dayDate = _currentWeekStart.AddDays(i);
            var isToday = dayDate.Date == DateTime.Today;
            var isWeekend = i >= 5;

            var dayLabel = new Label
            {
                Text = $"{dayNames[i]}\n{dayDate:dd.MM}",
                TextAlign = ContentAlignment.MiddleCenter,
                BackColor = isToday ? Color.Gold : (isWeekend ? Color.LightPink : Color.LightGray),
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                Dock = DockStyle.Fill
            };
            weekPanel.Controls.Add(dayLabel, i, 0);

            // События дня
            var eventsTextBox = new TextBox
            {
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Vertical,
                BackColor = Color.White,
                Dock = DockStyle.Fill,
                Font = new Font("Segoe UI", 9F)
            };

            if (weekEvents.TryGetValue(dayDate.Date, out var dayEvents) && dayEvents.Count > 0)
            {
                var eventsText = string.Join("\n\n", dayEvents.Select(evt =>
                {
                    var time = evt.IsAllDay ? "Весь день" : $"{evt.StartTime:HH:mm}";
                    var description = string.IsNullOrEmpty(evt.Description) ? "" : $"\n{evt.Description}";
                    return $"{GetCategoryIcon(evt.Category)} {evt.Title}\n{time}{description}";
                }));
                eventsTextBox.Text = eventsText;
            }
            else
            {
                eventsTextBox.Text = "Нет событий";
                eventsTextBox.ForeColor = Color.Gray;
            }

            weekPanel.Controls.Add(eventsTextBox, i, 1);
        }

        Controls.Add(weekPanel);
    }

    private static string GetCategoryIcon(EventCategory category) => category switch
    {
        EventCategory.Work => "💼",
        EventCategory.Personal => "👤",
        EventCategory.Holiday => "🎉",
        EventCategory.Birthday => "🎂",
        EventCategory.Meeting => "🤝",
        EventCategory.Appointment => "📅",
        _ => "📌"
    };
}