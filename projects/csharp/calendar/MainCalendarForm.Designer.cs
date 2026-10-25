using System.Globalization;
using CalendarApp.Models;
using CalendarApp.Services;
using Microsoft.Extensions.Logging;

namespace CalendarApp;

public partial class MainCalendarForm : Form
{
    private readonly ILogger<MainCalendarForm> _logger;
    private readonly CalendarService _calendarService;
    private DateTime _currentDate;
    private readonly List<DateTime> _holidays;

    // Контролы
    private ComboBox _yearComboBox = null!;
    private ComboBox _monthComboBox = null!;
    private TableLayoutPanel _calendarPanel = null!;
    private Button _todayButton = null!;
    private Button _addEventButton = null!;
    private Button _showHolidaysButton = null!;
    private Button _exportButton = null!;
    private Button _weekViewButton = null!;
    private Label _selectedDateLabel = null!;
    private ListBox _eventsListBox = null!;
    private CheckBox _highlightWeekendsCheckBox = null!;
    private Label _statisticsLabel = null!;

    public MainCalendarForm(ILogger<MainCalendarForm> logger)
    {
        _logger = logger;
        _calendarService = new CalendarService(_logger);
        _currentDate = DateTime.Now;
        _holidays = new List<DateTime>();

        InitializeComponent();
        InitializeHolidays();
        UpdateCalendar();
        UpdateStatistics();
    }

    private void InitializeComponent()
    {
        // Базовые настройки формы
        Text = "Календарь v2.0";
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.White;
        MinimumSize = new Size(800, 600);
        WindowState = FormWindowState.Maximized; // Максимизируем окно

        // Главная панель с адаптивной версткой
        var mainContainer = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 2,
            RowCount = 2
        };

        // Настройка размеров: календарь займет 70%, боковая панель 30%
        mainContainer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 70F));
        mainContainer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 30F));
        mainContainer.RowStyles.Add(new RowStyle(SizeType.Absolute, 50F)); // Верхняя панель
        mainContainer.RowStyles.Add(new RowStyle(SizeType.Percent, 100F)); // Основная область

        // Панель управления
        var topPanel = CreateTopPanel();
        mainContainer.Controls.Add(topPanel, 0, 0);
        mainContainer.SetColumnSpan(topPanel, 2); // Растянуть на 2 колонки

        // Календарная панель
        var calendarContainer = CreateCalendarPanel();
        mainContainer.Controls.Add(calendarContainer, 0, 1);

        // Боковая панель
        var sidePanel = CreateSidePanel();
        mainContainer.Controls.Add(sidePanel, 1, 1);

        Controls.Add(mainContainer);

        // Создаем календарную сетку сразу
        CreateCalendarGrid();
    }

    private Panel CreateTopPanel()
    {
        var topPanel = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = Color.FromArgb(70, 130, 180),
            Padding = new Padding(10)
        };

        // Год
        _yearComboBox = new ComboBox
        {
            Location = new Point(10, 15),
            Width = 70,
            DropDownStyle = ComboBoxStyle.DropDownList,
            Font = new Font("Segoe UI", 9F)
        };

        // Ограничиваем диапазон лет для производительности
        var currentYear = DateTime.Now.Year;
        for (int year = currentYear - 5; year <= currentYear + 5; year++)
        {
            _yearComboBox.Items.Add(year);
        }
        _yearComboBox.SelectedItem = _currentDate.Year;
        _yearComboBox.SelectedIndexChanged += (s, e) => DelayedUpdate();

        // Месяц
        _monthComboBox = new ComboBox
        {
            Location = new Point(90, 15),
            Width = 100,
            DropDownStyle = ComboBoxStyle.DropDownList,
            Font = new Font("Segoe UI", 9F)
        };

        var monthNames = CultureInfo.CurrentCulture.DateTimeFormat.MonthNames;
        for (int i = 0; i < 12; i++)
        {
            _monthComboBox.Items.Add(monthNames[i]);
        }
        _monthComboBox.SelectedIndex = _currentDate.Month - 1;
        _monthComboBox.SelectedIndexChanged += (s, e) => DelayedUpdate();

        // Кнопки
        _todayButton = CreateButton("Сегодня", new Point(200, 12), Color.LightGreen);
        _todayButton.Click += TodayButton_Click;

        _addEventButton = CreateButton("+ Событие", new Point(290, 12), Color.LightCoral);
        _addEventButton.Click += AddEventButton_Click;

        _showHolidaysButton = CreateButton("Праздники", new Point(390, 12), Color.LightGoldenrodYellow);
        _showHolidaysButton.Click += ShowHolidaysButton_Click;

        _exportButton = CreateButton("Экспорт", new Point(480, 12), Color.LightBlue);
        _exportButton.Click += ExportButton_Click;

        _weekViewButton = CreateButton("Неделя", new Point(560, 12), Color.Plum);
        _weekViewButton.Click += WeekViewButton_Click;

        _highlightWeekendsCheckBox = new CheckBox
        {
            Text = "Выделить выходные",
            Location = new Point(640, 15),
            Size = new Size(140, 20),
            Checked = true,
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 9F)
        };
        _highlightWeekendsCheckBox.CheckedChanged += (s, e) => UpdateCalendar();

        topPanel.Controls.AddRange(new Control[]
        {
            _yearComboBox, _monthComboBox, _todayButton, _addEventButton,
            _showHolidaysButton, _exportButton, _weekViewButton, _highlightWeekendsCheckBox
        });

        return topPanel;
    }

    private Panel CreateCalendarPanel()
    {
        var container = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(10),
            BackColor = Color.White
        };

        // Календарная сетка с фиксированным размером ячеек
        _calendarPanel = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 7,
            RowCount = 7,
            BackColor = Color.White,
            CellBorderStyle = TableLayoutPanelCellBorderStyle.Single
        };

        // Равные размеры для всех ячеек
        for (int i = 0; i < 7; i++)
        {
            _calendarPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 14.28f));
            _calendarPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 14.28f));
        }

        container.Controls.Add(_calendarPanel);
        return container;
    }

    private Panel CreateSidePanel()
    {
        var sidePanel = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = Color.FromArgb(248, 248, 255),
            Padding = new Padding(10)
        };

        _selectedDateLabel = new Label
        {
            Text = "Выбранная дата: " + DateTime.Now.ToShortDateString(),
            Location = new Point(10, 10),
            Size = new Size(250, 20),
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
        };

        var eventsLabel = new Label
        {
            Text = "События:",
            Location = new Point(10, 40),
            Size = new Size(100, 20),
            Font = new Font("Segoe UI", 9, FontStyle.Bold)
        };

        _eventsListBox = new ListBox
        {
            Location = new Point(10, 65),
            Size = new Size(250, 200),
            BackColor = Color.White,
            Font = new Font("Segoe UI", 9F),
            Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
        };

        _statisticsLabel = new Label
        {
            Location = new Point(10, 275),
            Size = new Size(250, 60),
            Font = new Font("Segoe UI", 9F),
            BackColor = Color.LightYellow,
            BorderStyle = BorderStyle.FixedSingle,
            TextAlign = ContentAlignment.TopLeft,
            Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
        };

        var clearButton = CreateButton("Очистить", new Point(10, 345), Color.LightSalmon);
        clearButton.Click += ClearEventsButton_Click;

        sidePanel.Controls.AddRange(new Control[]
        {
            _selectedDateLabel, eventsLabel, _eventsListBox, _statisticsLabel, clearButton
        });

        return sidePanel;
    }

    private Button CreateButton(string text, Point location, Color backColor)
    {
        return new Button
        {
            Text = text,
            Location = location,
            Size = new Size(80, 25),
            BackColor = backColor,
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 9F),
            ForeColor = Color.Black,
            UseVisualStyleBackColor = false
        };
    }

    private void CreateCalendarGrid()
    {
        _calendarPanel.Controls.Clear();

        // Заголовки дней недели
        string[] dayNames = { "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс" };
        for (int i = 0; i < 7; i++)
        {
            var dayLabel = new Label
            {
                Text = dayNames[i],
                TextAlign = ContentAlignment.MiddleCenter,
                BackColor = Color.FromArgb(70, 130, 180),
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Dock = DockStyle.Fill
            };
            _calendarPanel.Controls.Add(dayLabel, i, 0);
        }

        // Кнопки дней - создаем один раз и переиспользуем
        for (int week = 1; week < 7; week++)
        {
            for (int day = 0; day < 7; day++)
            {
                var dayButton = new Button
                {
                    Dock = DockStyle.Fill,
                    FlatStyle = FlatStyle.Flat,
                    Font = new Font("Segoe UI", 9),
                    BackColor = Color.White,
                    ForeColor = Color.Black,
                    UseVisualStyleBackColor = false
                };

                dayButton.FlatAppearance.BorderSize = 1;
                dayButton.FlatAppearance.BorderColor = Color.LightGray;
                dayButton.Click += DayButton_Click;

                _calendarPanel.Controls.Add(dayButton, day, week);
            }
        }
    }

    private void UpdateCalendar()
    {
        var firstDayOfMonth = new DateTime(_currentDate.Year, _currentDate.Month, 1);
        var daysInMonth = DateTime.DaysInMonth(_currentDate.Year, _currentDate.Month);
        var startDayOfWeek = ((int)firstDayOfMonth.DayOfWeek + 6) % 7;

        Text = $"Календарь - {CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(_currentDate.Month)} {_currentDate.Year}";

        // Получаем события один раз
        var monthEvents = _calendarService.GetEventsForMonth(_currentDate.Year, _currentDate.Month);

        int dayCounter = 1;

        // Обновляем только содержимое кнопок, не создавая новые
        for (int week = 1; week < 7; week++)
        {
            for (int day = 0; day < 7; day++)
            {
                var dayButton = (Button)_calendarPanel.GetControlFromPosition(day, week)!;

                if (week == 1 && day < startDayOfWeek)
                {
                    // Предыдущий месяц
                    var prevDate = firstDayOfMonth.AddDays(day - startDayOfWeek);
                    dayButton.Text = prevDate.Day.ToString();
                    dayButton.BackColor = Color.LightGray;
                    dayButton.ForeColor = Color.Gray;
                    dayButton.Tag = prevDate;
                }
                else if (dayCounter <= daysInMonth)
                {
                    var cellDate = new DateTime(_currentDate.Year, _currentDate.Month, dayCounter);
                    dayButton.Text = dayCounter.ToString();
                    dayButton.Tag = cellDate;
                    dayButton.ForeColor = Color.Black;

                    // Простая логика цветов без сложных вычислений
                    if (cellDate.Date == DateTime.Today)
                    {
                        dayButton.BackColor = Color.Gold;
                    }
                    else if (_highlightWeekendsCheckBox.Checked && (day == 5 || day == 6))
                    {
                        dayButton.BackColor = Color.LightPink;
                    }
                    else if (_holidays.Contains(cellDate.Date))
                    {
                        dayButton.BackColor = Color.LightGreen;
                    }
                    else if (monthEvents.ContainsKey(cellDate.Date))
                    {
                        dayButton.BackColor = Color.LightBlue;
                        // Показываем количество событий
                        if (monthEvents[cellDate.Date].Count > 1)
                        {
                            dayButton.Text += $" ({monthEvents[cellDate.Date].Count})";
                        }
                    }
                    else
                    {
                        dayButton.BackColor = Color.White;
                    }

                    dayCounter++;
                }
                else
                {
                    // Следующий месяц
                    var nextDate = firstDayOfMonth.AddMonths(1).AddDays(dayCounter - daysInMonth - 1);
                    dayButton.Text = nextDate.Day.ToString();
                    dayButton.BackColor = Color.LightGray;
                    dayButton.ForeColor = Color.Gray;
                    dayButton.Tag = nextDate;
                    dayCounter++;
                }
            }
        }

        UpdateEventsDisplay();
    }

    private void UpdateEventsDisplay()
    {
        _eventsListBox.Items.Clear();

        var monthEvents = _calendarService.GetEventsForMonth(_currentDate.Year, _currentDate.Month);
        var allEvents = monthEvents
            .SelectMany(kvp => kvp.Value.Select(evt => new { Date = kvp.Key, Event = evt }))
            .OrderBy(x => x.Date)
            .Take(20); // Ограничиваем для производительности

        foreach (var item in allEvents)
        {
            var timeStr = item.Event.IsAllDay ? "" : $" {item.Event.StartTime:HH:mm}";
            _eventsListBox.Items.Add($"{item.Date.Day:00}{timeStr} {item.Event.Title}");
        }
    }

    private void UpdateStatistics()
    {
        var stats = _calendarService.GetStatistics();
        _statisticsLabel.Text = $"Статистика:\n\nВсего: {stats.TotalEvents}\nМесяц: {stats.ThisMonth}\nНеделя: {stats.NextWeek}";
    }

    private void InitializeHolidays()
    {
        int year = _currentDate.Year;
        _holidays.Clear();
        _holidays.AddRange(new DateTime[]
        {
            new DateTime(year, 1, 1), new DateTime(year, 1, 7), new DateTime(year, 2, 23),
            new DateTime(year, 3, 8), new DateTime(year, 5, 1), new DateTime(year, 5, 9),
            new DateTime(year, 6, 12), new DateTime(year, 11, 4)
        });
    }

    // Отложенное обновление для избежания лагов при быстром переключении
    private System.Windows.Forms.Timer? _delayTimer;
    private void DelayedUpdate()
    {
        _delayTimer?.Stop();
        _delayTimer = new System.Windows.Forms.Timer { Interval = 300 };
        _delayTimer.Tick += (s, e) =>
        {
            _delayTimer.Stop();
            if (_yearComboBox.SelectedItem is int selectedYear)
            {
                _currentDate = new DateTime(selectedYear, _monthComboBox.SelectedIndex + 1, 1);
                InitializeHolidays();
                UpdateCalendar();
                UpdateStatistics();
            }
        };
        _delayTimer.Start();
    }

    // Обработчики событий
    private void DayButton_Click(object? sender, EventArgs e)
    {
        if (sender is Button button && button.Tag is DateTime selectedDate)
        {
            _selectedDateLabel.Text = "Выбранная дата: " + selectedDate.ToString("dd.MM.yyyy");

            var events = _calendarService.GetEventsForDate(selectedDate);
            if (events.Count > 0)
            {
                var eventsList = string.Join("\n", events.Select(evt => $"• {evt.Title}"));
                MessageBox.Show($"События на {selectedDate:dd.MM.yyyy}:\n\n{eventsList}", "События дня");
            }
        }
    }

    private void TodayButton_Click(object? sender, EventArgs e)
    {
        _currentDate = DateTime.Now;
        _yearComboBox.SelectedItem = _currentDate.Year;
        _monthComboBox.SelectedIndex = _currentDate.Month - 1;
        UpdateCalendar();
        UpdateStatistics();
    }

    private async void AddEventButton_Click(object? sender, EventArgs e)
    {
        using var form = new AddEventForm();
        if (form.ShowDialog() == DialogResult.OK)
        {
            var calendarEvent = new CalendarEvent
            {
                Date = form.EventDate,
                Title = form.EventText,
                Description = form.EventDescription,
                ColorHex = ColorTranslator.ToHtml(form.EventColor),
                IsAllDay = form.IsAllDay,
                StartTime = form.StartTime,
                EndTime = form.EndTime,
                Category = form.EventCategory,
                Reminder = form.Reminder
            };

            await _calendarService.AddEventAsync(calendarEvent);
            UpdateCalendar();
            UpdateStatistics();
        }
    }

    private void ShowHolidaysButton_Click(object? sender, EventArgs e)
    {
        var holidayList = $"Праздники {_currentDate.Year} года:\n\n";
        var holidayNames = new Dictionary<(int Month, int Day), string>
        {
            [(1, 1)] = "Новый год",
            [(1, 7)] = "Рождество",
            [(2, 23)] = "День защитника Отечества",
            [(3, 8)] = "Женский день",
            [(5, 1)] = "Праздник Труда",
            [(5, 9)] = "День Победы",
            [(6, 12)] = "День России",
            [(11, 4)] = "День единства"
        };

        foreach (var holiday in _holidays.OrderBy(h => h))
        {
            var key = (holiday.Month, holiday.Day);
            var name = holidayNames.TryGetValue(key, out var holidayName) ? holidayName : "Праздник";
            holidayList += $"{holiday:dd.MM.yyyy} - {name}\n";
        }

        MessageBox.Show(holidayList, "Праздники");
    }

    private async void ExportButton_Click(object? sender, EventArgs e)
    {
        using var dialog = new SaveFileDialog { Filter = "Text files (*.txt)|*.txt", DefaultExt = "txt" };
        if (dialog.ShowDialog() == DialogResult.OK)
        {
            await _calendarService.ExportEventsAsync(dialog.FileName, _currentDate.Year, _currentDate.Month);
            MessageBox.Show("Экспорт завершен!", "Экспорт");
        }
    }

    private void WeekViewButton_Click(object? sender, EventArgs e)
    {
        using var weekForm = new WeekViewForm(_currentDate, _calendarService, _logger);
        weekForm.ShowDialog();
    }

    private async void ClearEventsButton_Click(object? sender, EventArgs e)
    {
        if (MessageBox.Show("Удалить все события?", "Подтверждение", MessageBoxButtons.YesNo) == DialogResult.Yes)
        {
            await _calendarService.ClearAllEventsAsync();
            UpdateCalendar();
            UpdateStatistics();
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _delayTimer?.Dispose();
        }
        base.Dispose(disposing);
    }
}