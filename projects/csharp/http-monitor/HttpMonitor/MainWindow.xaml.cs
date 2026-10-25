using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
using HttpMonitor.Models;
using HttpMonitor.Services;

namespace HttpMonitor
{
    /// <summary>
    /// Главное окно приложения — Система мониторинга HTTP-запросов.
    /// 
    /// Архитектура:
    ///   - HttpServerService  — HTTP-сервер (HttpListener)
    ///   - HttpClientService  — HTTP-клиент (HttpClient)
    ///   - LogService         — запись логов в файл
    ///   - DispatcherTimer    — таймер для обновления Uptime
    /// 
    /// Все обращения к UI выполняются через Dispatcher.Invoke(),
    /// т.к. события от сервера приходят из фоновых потоков.
    /// </summary>
    public partial class MainWindow : Window
    {
        // Сервисы
        private readonly HttpServerService _server = new();
        private readonly HttpClientService _client = new();
        private readonly LogService _logService = new();

        // Все записи логов (для фильтрации в мониторинге)
        private readonly ObservableCollection<RequestLogEntry> _allLogs = new();

        // Таймер для обновления Uptime каждую секунду
        private readonly DispatcherTimer _uptimeTimer;

        // Данные для графика нагрузки
        private readonly ObservableCollection<ChartDataPoint> _chartData = new();

        public MainWindow()
        {
            InitializeComponent();

            // Подписываемся на события сервера
            _server.OnLogEntry += OnServerLogEntry;
            _server.OnStatisticsUpdated += OnStatisticsUpdated;

            // Подписываемся на события клиента
            _client.OnLogEntry += OnClientLogEntry;

            // Привязываем DataGrid к коллекции логов
            LogsDataGrid.ItemsSource = _allLogs;

            // Привязываем график
            ChartItemsControl.ItemsSource = _chartData;

            // Настраиваем таймер обновления Uptime
            _uptimeTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(1)
            };
            _uptimeTimer.Tick += (_, _) => UpdateUptime();
        }

        // ═══════════════════════════════════════════════
        // СЕРВЕР — обработчики событий
        // ═══════════════════════════════════════════════

        /// <summary>
        /// Запуск HTTP-сервера.
        /// </summary>
        private async void StartServer_Click(object sender, RoutedEventArgs e)
        {
            if (!int.TryParse(PortInput.Text, out int port) || port < 1 || port > 65535)
            {
                MessageBox.Show("Введите корректный порт (1-65535)", "Ошибка",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            try
            {
                await _server.StartAsync(port);

                // Обновляем UI
                StartServerBtn.IsEnabled = false;
                StopServerBtn.IsEnabled = true;
                PortInput.IsEnabled = false;
                ServerStatusText.Text = $"🟢 Сервер запущен на http://localhost:{port}/";

                // Запускаем таймер Uptime
                _uptimeTimer.Start();

                AppendServerLog($"[{DateTime.Now:HH:mm:ss}] ✅ Сервер запущен на порту {port}");
                AppendServerLog($"  GET  http://localhost:{port}/         → статус сервера");
                AppendServerLog($"  GET  http://localhost:{port}/messages → список сообщений");
                AppendServerLog($"  POST http://localhost:{port}/         → отправить сообщение");
                AppendServerLog("─────────────────────────────────────────────");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ошибка запуска сервера: {ex.Message}\n\n" +
                    "Попробуйте другой порт или запустите от имени администратора.",
                    "Ошибка", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        /// <summary>
        /// Остановка HTTP-сервера.
        /// </summary>
        private void StopServer_Click(object sender, RoutedEventArgs e)
        {
            _server.Stop();
            _uptimeTimer.Stop();

            StartServerBtn.IsEnabled = true;
            StopServerBtn.IsEnabled = false;
            PortInput.IsEnabled = true;
            ServerStatusText.Text = "⚫ Сервер остановлен";

            AppendServerLog($"[{DateTime.Now:HH:mm:ss}] ⛔ Сервер остановлен");
        }

        /// <summary>
        /// Обработка новой записи лога от сервера.
        /// Dispatcher.Invoke — переключение на UI-поток из фонового.
        /// </summary>
        private void OnServerLogEntry(RequestLogEntry entry)
        {
            Dispatcher.Invoke(() =>
            {
                AppendServerLog(entry.DisplayText);
                _allLogs.Insert(0, entry);
                _logService.WriteLog(entry);
            });
        }

        /// <summary>
        /// Обновление статистики сервера в UI.
        /// </summary>
        private void OnStatisticsUpdated(ServerStatistics stats)
        {
            Dispatcher.Invoke(() =>
            {
                // Вкладка Сервер
                TotalRequestsText.Text = stats.TotalRequests.ToString();
                GetRequestsText.Text = stats.GetRequests.ToString();
                PostRequestsText.Text = stats.PostRequests.ToString();
                AvgTimeText.Text = $"{stats.AverageProcessingTimeMs:F1} мс";

                // Вкладка Мониторинг
                MonTotalText.Text = stats.TotalRequests.ToString();
                MonGetText.Text = stats.GetRequests.ToString();
                MonPostText.Text = stats.PostRequests.ToString();
                MonAvgText.Text = $"{stats.AverageProcessingTimeMs:F1}";
                MonMsgText.Text = stats.StoredMessages.ToString();
            });
        }

        /// <summary>
        /// Обновление Uptime каждую секунду.
        /// </summary>
        private void UpdateUptime()
        {
            var stats = _server.GetStatistics();
            UptimeText.Text = stats.Uptime;
            MonUptimeText.Text = stats.Uptime;
        }

        /// <summary>
        /// Добавить строку в лог сервера (текстовое поле).
        /// </summary>
        private void AppendServerLog(string text)
        {
            ServerLogsTextBox.AppendText(text + Environment.NewLine);
            ServerLogsTextBox.ScrollToEnd();
        }

        // ═══════════════════════════════════════════════
        // КЛИЕНТ — обработчики событий
        // ═══════════════════════════════════════════════

        /// <summary>
        /// Показать/скрыть поле тела запроса при смене метода.
        /// </summary>
        private void MethodComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (RequestBodyGroup == null) return;

            var selected = (MethodComboBox.SelectedItem as ComboBoxItem)?.Content?.ToString();
            RequestBodyGroup.Visibility = selected == "POST" ? Visibility.Visible : Visibility.Collapsed;

            // Подсказка URL для POST на локальный сервер
            if (selected == "POST" && ClientUrlInput != null)
            {
                var port = PortInput?.Text ?? "5000";
                ClientUrlInput.Text = $"http://localhost:{port}/";
            }
            else if (selected == "GET" && ClientUrlInput != null)
            {
                ClientUrlInput.Text = "https://jsonplaceholder.typicode.com/posts";
            }
        }

        /// <summary>
        /// Отправка HTTP-запроса.
        /// </summary>
        private async void SendRequest_Click(object sender, RoutedEventArgs e)
        {
            var url = ClientUrlInput.Text.Trim();
            if (string.IsNullOrEmpty(url))
            {
                MessageBox.Show("Введите URL", "Ошибка", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            // Блокируем кнопку на время запроса
            SendRequestBtn.IsEnabled = false;
            SendRequestBtn.Content = "⏳ Отправка...";
            ResponseTextBox.Text = "Выполняется запрос...";
            ResponseStatusText.Text = "...";
            ResponseTimeText.Text = "...";

            try
            {
                var method = (MethodComboBox.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "GET";
                string response;
                int statusCode;

                var sw = System.Diagnostics.Stopwatch.StartNew();

                if (method == "GET")
                {
                    (response, statusCode) = await _client.SendGetAsync(url);
                }
                else
                {
                    var body = RequestBodyInput.Text;
                    (response, statusCode) = await _client.SendPostAsync(url, body);
                }

                sw.Stop();

                // Отображаем результат
                ResponseTextBox.Text = FormatJson(response);
                ResponseStatusText.Text = statusCode > 0 ? $"{statusCode}" : "Ошибка";
                ResponseStatusText.Foreground = statusCode >= 200 && statusCode < 300
                    ? System.Windows.Media.Brushes.Green
                    : System.Windows.Media.Brushes.Red;
                ResponseTimeText.Text = $"{sw.ElapsedMilliseconds} мс";
            }
            catch (Exception ex)
            {
                ResponseTextBox.Text = $"Ошибка: {ex.Message}";
                ResponseStatusText.Text = "Ошибка";
                ResponseStatusText.Foreground = System.Windows.Media.Brushes.Red;
            }
            finally
            {
                SendRequestBtn.IsEnabled = true;
                SendRequestBtn.Content = "🚀 Отправить запрос";
            }
        }

        /// <summary>
        /// Обработка новой записи лога от клиента.
        /// </summary>
        private void OnClientLogEntry(RequestLogEntry entry)
        {
            Dispatcher.Invoke(() =>
            {
                _allLogs.Insert(0, entry);
                _logService.WriteLog(entry);
            });
        }

        /// <summary>
        /// Попытка красиво отформатировать JSON.
        /// </summary>
        private string FormatJson(string json)
        {
            try
            {
                var obj = Newtonsoft.Json.JsonConvert.DeserializeObject(json);
                return Newtonsoft.Json.JsonConvert.SerializeObject(obj, Newtonsoft.Json.Formatting.Indented);
            }
            catch
            {
                return json;
            }
        }

        // ═══════════════════════════════════════════════
        // МОНИТОРИНГ — обработчики событий
        // ═══════════════════════════════════════════════

        /// <summary>
        /// Обновить столбчатую диаграмму нагрузки.
        /// </summary>
        private void RefreshChart_Click(object sender, RoutedEventArgs e)
        {
            if (!_server.IsRunning)
            {
                MessageBox.Show("Сервер не запущен", "Информация",
                    MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            var data = _server.GetRequestsPerMinute();
            _chartData.Clear();

            if (data.Count == 0)
            {
                return;
            }

            var maxCount = data.Values.Max();
            var maxHeight = 120.0;

            // Берём последние 15 минут
            var sorted = data.OrderBy(kv => kv.Key).TakeLast(15);

            foreach (var kv in sorted)
            {
                _chartData.Add(new ChartDataPoint
                {
                    Minute = kv.Key,
                    Count = kv.Value,
                    BarHeight = maxCount > 0 ? (kv.Value / (double)maxCount) * maxHeight : 2
                });
            }
        }

        /// <summary>
        /// Фильтрация логов при изменении фильтров.
        /// </summary>
        private void FilterChanged(object sender, SelectionChangedEventArgs e)
        {
            ApplyFilters();
        }

        /// <summary>
        /// Применение фильтров к таблице логов.
        /// </summary>
        private void ApplyFilters()
        {
            if (LogsDataGrid == null || FilterMethodComboBox == null) return;

            var method = (FilterMethodComboBox.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "Все";
            var direction = (FilterDirectionComboBox.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "Все";
            var status = (FilterStatusComboBox.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "Все";

            var filtered = _allLogs.AsEnumerable();

            if (method != "Все")
                filtered = filtered.Where(l => l.Method == method);

            if (direction != "Все")
                filtered = filtered.Where(l => l.Direction == direction);

            if (status != "Все")
            {
                filtered = status switch
                {
                    "2xx (Успех)" => filtered.Where(l => l.StatusCode >= 200 && l.StatusCode < 300),
                    "4xx (Ошибка)" => filtered.Where(l => l.StatusCode >= 400 && l.StatusCode < 500),
                    "5xx (Сервер)" => filtered.Where(l => l.StatusCode >= 500 && l.StatusCode < 600),
                    _ => filtered
                };
            }

            LogsDataGrid.ItemsSource = new ObservableCollection<RequestLogEntry>(filtered);
        }

        /// <summary>
        /// Сохранение логов в файл.
        /// </summary>
        private void SaveLogs_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show($"Логи сохраняются автоматически в:\n{_logService.LogFilePath}",
                "Логирование", MessageBoxButton.OK, MessageBoxImage.Information);
        }

        /// <summary>
        /// При закрытии окна — останавливаем сервер.
        /// </summary>
        protected override void OnClosed(EventArgs e)
        {
            _server.Stop();
            _uptimeTimer.Stop();
            base.OnClosed(e);
        }
    }

    /// <summary>
    /// Модель точки данных для столбчатой диаграммы.
    /// Используется для привязки к ItemsControl в графике нагрузки.
    /// </summary>
    public class ChartDataPoint
    {
        public string Minute { get; set; } = "";
        public int Count { get; set; }
        public double BarHeight { get; set; }
    }
}
