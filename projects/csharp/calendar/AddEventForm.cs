using CalendarApp.Models;

namespace CalendarApp;

public partial class AddEventForm : Form
{
    public DateTime EventDate { get; private set; }
    public string EventText { get; private set; } = string.Empty;
    public string EventDescription { get; private set; } = string.Empty;
    public Color EventColor { get; private set; }
    public bool IsAllDay { get; private set; } = true;
    public TimeOnly? StartTime { get; private set; }
    public TimeOnly? EndTime { get; private set; }
    public EventCategory EventCategory { get; private set; } = EventCategory.Personal;
    public TimeSpan? Reminder { get; private set; }

    private DateTimePicker _datePicker = null!;
    private TextBox _eventTextBox = null!;
    private TextBox _descriptionTextBox = null!;
    private Button _colorButton = null!;
    private Panel _colorPanel = null!;
    private CheckBox _allDayCheckBox = null!;
    private DateTimePicker _startTimePicker = null!;
    private DateTimePicker _endTimePicker = null!;
    private ComboBox _categoryComboBox = null!;
    private ComboBox _reminderComboBox = null!;

    public AddEventForm()
    {
        InitializeComponent();
        EventDate = DateTime.Today;
        EventColor = Color.LightBlue;
    }

    private void InitializeComponent()
    {
        Text = "Добавить событие";
        Size = new Size(500, 550);
        StartPosition = FormStartPosition.CenterParent;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        BackColor = Color.White;
        Font = new Font("Segoe UI", 9F);

        // Заголовок
        var titleLabel = new Label
        {
            Text = "Новое событие",
            Location = new Point(20, 15),
            Size = new Size(200, 25),
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            ForeColor = Color.FromArgb(70, 130, 180)
        };

        // Дата
        var dateLabel = new Label
        {
            Text = "📅 Дата:",
            Location = new Point(20, 50),
            Size = new Size(80, 20)
        };

        _datePicker = new DateTimePicker
        {
            Location = new Point(110, 48),
            Size = new Size(200, 23),
            Value = DateTime.Today,
            Format = DateTimePickerFormat.Short
        };

        // Название события
        var textLabel = new Label
        {
            Text = "📝 Название:",
            Location = new Point(20, 85),
            Size = new Size(80, 20)
        };

        _eventTextBox = new TextBox
        {
            Location = new Point(110, 83),
            Size = new Size(320, 23),
            Font = new Font("Segoe UI", 9F)
        };

        // Описание
        var descLabel = new Label
        {
            Text = "📄 Описание:",
            Location = new Point(20, 120),
            Size = new Size(80, 20)
        };

        _descriptionTextBox = new TextBox
        {
            Location = new Point(110, 118),
            Size = new Size(320, 60),
            Multiline = true,
            ScrollBars = ScrollBars.Vertical,
            Font = new Font("Segoe UI", 9F)
        };

        // Категория
        var categoryLabel = new Label
        {
            Text = "🏷️ Категория:",
            Location = new Point(20, 195),
            Size = new Size(80, 20)
        };

        _categoryComboBox = new ComboBox
        {
            Location = new Point(110, 193),
            Size = new Size(150, 23),
            DropDownStyle = ComboBoxStyle.DropDownList
        };

        foreach (EventCategory category in Enum.GetValues<EventCategory>())
        {
            _categoryComboBox.Items.Add(GetCategoryDisplayName(category));
        }
        _categoryComboBox.SelectedIndex = 0;

        // Весь день
        _allDayCheckBox = new CheckBox
        {
            Text = "🕐 Весь день",
            Location = new Point(280, 195),
            Size = new Size(120, 20),
            Checked = true
        };
        _allDayCheckBox.CheckedChanged += AllDayCheckBox_CheckedChanged;

        // Время начала
        var startTimeLabel = new Label
        {
            Text = "⏰ Начало:",
            Location = new Point(20, 230),
            Size = new Size(80, 20)
        };

        _startTimePicker = new DateTimePicker
        {
            Location = new Point(110, 228),
            Size = new Size(100, 23),
            Format = DateTimePickerFormat.Time,
            ShowUpDown = true,
            Enabled = false
        };

        // Время окончания
        var endTimeLabel = new Label
        {
            Text = "⏰ Окончание:",
            Location = new Point(230, 230),
            Size = new Size(80, 20)
        };

        _endTimePicker = new DateTimePicker
        {
            Location = new Point(320, 228),
            Size = new Size(100, 23),
            Format = DateTimePickerFormat.Time,
            ShowUpDown = true,
            Value = DateTime.Today.AddHours(1),
            Enabled = false
        };

        // Напоминание
        var reminderLabel = new Label
        {
            Text = "🔔 Напоминание:",
            Location = new Point(20, 265),
            Size = new Size(100, 20)
        };

        _reminderComboBox = new ComboBox
        {
            Location = new Point(130, 263),
            Size = new Size(150, 23),
            DropDownStyle = ComboBoxStyle.DropDownList
        };

        _reminderComboBox.Items.AddRange(new object[]
        {
            "Без напоминания",
            "За 5 минут",
            "За 15 минут",
            "За 30 минут",
            "За 1 час",
            "За 1 день",
            "За 1 неделю"
        });
        _reminderComboBox.SelectedIndex = 0;

        // Цвет
        var colorLabel = new Label
        {
            Text = "🎨 Цвет:",
            Location = new Point(20, 300),
            Size = new Size(60, 20)
        };

        _colorButton = new Button
        {
            Text = "Выбрать цвет",
            Location = new Point(90, 298),
            Size = new Size(120, 25),
            FlatStyle = FlatStyle.Flat
        };
        _colorButton.Click += ColorButton_Click;

        _colorPanel = new Panel
        {
            Location = new Point(220, 298),
            Size = new Size(60, 25),
            BackColor = Color.LightBlue,
            BorderStyle = BorderStyle.FixedSingle
        };

        // Разделитель
        var separator = new Panel
        {
            Location = new Point(20, 340),
            Size = new Size(440, 1),
            BackColor = Color.LightGray
        };

        // Кнопки
        var okButton = new Button
        {
            Text = "✅ Создать",
            Location = new Point(270, 360),
            Size = new Size(90, 35),
            DialogResult = DialogResult.OK,
            BackColor = Color.FromArgb(144, 238, 144),
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 9F, FontStyle.Bold)
        };
        okButton.Click += OkButton_Click;

        var cancelButton = new Button
        {
            Text = "❌ Отмена",
            Location = new Point(370, 360),
            Size = new Size(90, 35),
            DialogResult = DialogResult.Cancel,
            BackColor = Color.FromArgb(255, 182, 193),
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 9F)
        };

        Controls.AddRange(new Control[]
        {
            titleLabel, dateLabel, _datePicker, textLabel, _eventTextBox,
            descLabel, _descriptionTextBox, categoryLabel, _categoryComboBox,
            _allDayCheckBox, startTimeLabel, _startTimePicker, endTimeLabel, _endTimePicker,
            reminderLabel, _reminderComboBox, colorLabel, _colorButton, _colorPanel,
            separator, okButton, cancelButton
        });

        // Устанавливаем фокус на поле названия
        _eventTextBox.Focus();
    }

    private static string GetCategoryDisplayName(EventCategory category) => category switch
    {
        EventCategory.Personal => "👤 Личное",
        EventCategory.Work => "💼 Работа",
        EventCategory.Holiday => "🎉 Праздник",
        EventCategory.Birthday => "🎂 День рождения",
        EventCategory.Meeting => "🤝 Встреча",
        EventCategory.Appointment => "📅 Назначение",
        EventCategory.Other => "📌 Другое",
        _ => category.ToString()
    };

    private void AllDayCheckBox_CheckedChanged(object? sender, EventArgs e)
    {
        var isAllDay = _allDayCheckBox.Checked;
        _startTimePicker.Enabled = !isAllDay;
        _endTimePicker.Enabled = !isAllDay;

        if (isAllDay)
        {
            _startTimePicker.Value = DateTime.Today.AddHours(9);
            _endTimePicker.Value = DateTime.Today.AddHours(10);
        }
    }

    private void ColorButton_Click(object? sender, EventArgs e)
    {
        using var colorDialog = new ColorDialog
        {
            FullOpen = true,
            CustomColors = new int[]
            {
                ColorTranslator.ToOle(Color.LightBlue),
                ColorTranslator.ToOle(Color.LightGreen),
                ColorTranslator.ToOle(Color.LightPink),
                ColorTranslator.ToOle(Color.LightYellow),
                ColorTranslator.ToOle(Color.LightCoral),
                ColorTranslator.ToOle(Color.LightGray)
            }
        };

        if (colorDialog.ShowDialog() == DialogResult.OK)
        {
            EventColor = colorDialog.Color;
            _colorPanel.BackColor = EventColor;
        }
    }

    private void OkButton_Click(object? sender, EventArgs e)
    {
        if (string.IsNullOrWhiteSpace(_eventTextBox.Text))
        {
            MessageBox.Show("Пожалуйста, введите название события!", "Ошибка",
                          MessageBoxButtons.OK, MessageBoxIcon.Warning);
            _eventTextBox.Focus();
            return;
        }

        // Валидация времени
        if (!_allDayCheckBox.Checked && _startTimePicker.Value.TimeOfDay >= _endTimePicker.Value.TimeOfDay)
        {
            MessageBox.Show("Время окончания должно быть позже времени начала!", "Ошибка",
                          MessageBoxButtons.OK, MessageBoxIcon.Warning);
            _endTimePicker.Focus();
            return;
        }

        EventDate = _datePicker.Value.Date;
        EventText = _eventTextBox.Text.Trim();
        EventDescription = _descriptionTextBox.Text.Trim();
        IsAllDay = _allDayCheckBox.Checked;

        if (!IsAllDay)
        {
            StartTime = TimeOnly.FromDateTime(_startTimePicker.Value);
            EndTime = TimeOnly.FromDateTime(_endTimePicker.Value);
        }

        EventCategory = (EventCategory)_categoryComboBox.SelectedIndex;

        // Установка напоминания
        Reminder = _reminderComboBox.SelectedIndex switch
        {
            1 => TimeSpan.FromMinutes(5),
            2 => TimeSpan.FromMinutes(15),
            3 => TimeSpan.FromMinutes(30),
            4 => TimeSpan.FromHours(1),
            5 => TimeSpan.FromDays(1),
            6 => TimeSpan.FromDays(7),
            _ => null
        };
    }
}   