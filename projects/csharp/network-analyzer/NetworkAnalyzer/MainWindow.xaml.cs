using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Controls;
using NetworkAnalyzer.Models;
using NetworkAnalyzer.Services;

namespace NetworkAnalyzer
{
    /// <summary>
    /// Логика (code-behind) главного окна приложения.
    /// 
    /// ПОЯСНЕНИЕ:
    /// В WPF каждое окно состоит из двух файлов:
    ///   1. MainWindow.xaml — РАЗМЕТКА (внешний вид, расположение элементов)
    ///   2. MainWindow.xaml.cs — КОД (логика обработки событий)
    /// 
    /// Ключевое слово "partial" означает, что класс определён в двух файлах:
    /// компилятор объединяет XAML-часть и C#-часть в один класс.
    /// 
    /// АРХИТЕКТУРА:
    /// - MainWindow отвечает за UI и обработку событий (нажатия кнопок и т.д.)
    /// - NetworkService содержит бизнес-логику (работа с сетью)
    /// - Models хранят структуры данных
    /// Это разделение упрощает поддержку и тестирование кода.
    /// </summary>
    public partial class MainWindow : Window
    {
        // ========================== ПОЛЯ КЛАССА ==========================

        /// <summary>
        /// Экземпляр сервиса для работы с сетью.
        /// readonly — поле может быть присвоено только в конструкторе.
        /// Это гарантирует, что сервис не будет случайно перезаписан.
        /// </summary>
        private readonly NetworkService _networkService = new();

        /// <summary>
        /// ObservableCollection — специальная коллекция, которая АВТОМАТИЧЕСКИ
        /// уведомляет UI об изменениях (добавление/удаление элементов).
        /// 
        /// В отличие от обычного List<T>, при добавлении элемента в 
        /// ObservableCollection привязанный ListBox автоматически обновится.
        /// Это реализация паттерна Observer (Наблюдатель).
        /// </summary>
        private readonly ObservableCollection<UrlHistoryItem> _urlHistory = new();

        // ========================== КОНСТРУКТОР ==========================

        /// <summary>
        /// Конструктор главного окна.
        /// Вызывается один раз при создании окна.
        /// </summary>
        public MainWindow()
        {
            // InitializeComponent() — метод, сгенерированный из XAML.
            // Он создаёт все элементы UI, описанные в MainWindow.xaml,
            // и связывает их с именованными полями (x:Name).
            InitializeComponent();

            // Привязываем коллекцию истории к ListBox.
            // Теперь любые изменения в _urlHistory автоматически
            // отобразятся в LstHistory.
            LstHistory.ItemsSource = _urlHistory;

            // Загружаем список сетевых интерфейсов при запуске
            LoadNetworkInterfaces();
        }

        // ========================== СЕТЕВЫЕ ИНТЕРФЕЙСЫ ==========================

        /// <summary>
        /// Загружает и отображает список всех сетевых интерфейсов.
        /// Вызывается при запуске и при нажатии кнопки "Обновить".
        /// </summary>
        private void LoadNetworkInterfaces()
        {
            try
            {
                // Получаем список интерфейсов из сервиса
                List<NetworkInterfaceInfo> interfaces = _networkService.GetAllInterfaces();

                // Устанавливаем список как источник данных для ListBox.
                // WPF вызывает ToString() для каждого объекта при отображении.
                LstInterfaces.ItemsSource = interfaces;

                // Сбрасываем текст деталей
                TxtInterfaceDetails.Text = $"Найдено интерфейсов: {interfaces.Count}\n" +
                                           "Выберите интерфейс из списка для просмотра деталей.";
            }
            catch (Exception ex)
            {
                // MessageBox — стандартное диалоговое окно WPF для сообщений
                MessageBox.Show($"Ошибка загрузки интерфейсов:\n{ex.Message}",
                    "Ошибка", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        /// <summary>
        /// Обработчик нажатия кнопки "Обновить список интерфейсов".
        /// 
        /// ПОЯСНЕНИЕ:
        /// Обработчик события (event handler) — метод, который вызывается
        /// при определённом действии пользователя.
        /// Параметры:
        ///   sender — объект, вызвавший событие (кнопка)
        ///   e — аргументы события (RoutedEventArgs для WPF)
        /// </summary>
        private void BtnRefreshInterfaces_Click(object sender, RoutedEventArgs e)
        {
            LoadNetworkInterfaces();
        }

        /// <summary>
        /// Обработчик выбора интерфейса из списка.
        /// Отображает подробную информацию о выбранном интерфейсе.
        /// 
        /// ПОЯСНЕНИЕ:
        /// SelectionChangedEventArgs содержит информацию о том, что было
        /// выбрано/снято с выбора. SelectedItem — текущий выбранный элемент.
        /// 
        /// Оператор "is" с паттерн-матчингом (C# 7+):
        ///   if (obj is Type variable) — проверяет тип И присваивает переменную.
        ///   Эквивалент: if (obj is Type) { var variable = (Type)obj; ... }
        /// </summary>
        private void LstInterfaces_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (LstInterfaces.SelectedItem is NetworkInterfaceInfo info)
            {
                // Формируем строку с детальной информацией.
                // \n — перенос строки, делает вывод более читаемым.
                TxtInterfaceDetails.Text =
                    $"Имя:              {info.Name}\n" +
                    $"Описание:         {info.Description}\n" +
                    $"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                    $"IP-адрес:         {info.IpAddress}\n" +
                    $"Маска подсети:    {info.SubnetMask}\n" +
                    $"MAC-адрес:        {info.MacAddress}\n" +
                    $"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                    $"Состояние:        {info.Status}\n" +
                    $"Скорость:         {info.Speed}\n" +
                    $"Тип интерфейса:   {info.InterfaceType}";
            }
        }

        // ========================== АНАЛИЗ URL ==========================

        /// <summary>
        /// Обработчик кнопки "Анализ URL".
        /// Парсит введённый URL и отображает его компоненты.
        /// </summary>
        private void BtnParseUrl_Click(object sender, RoutedEventArgs e)
        {
            string url = TxtUrl.Text.Trim();

            if (string.IsNullOrEmpty(url))
            {
                TxtResults.Text = "⚠️ Введите URL для анализа!";
                return;
            }

            // Получаем результат парсинга из сервиса
            Dictionary<string, string> parsed = _networkService.ParseUrl(url);

            // Формируем красивый вывод результатов
            string result = "🔗 РЕЗУЛЬТАТЫ ПАРСИНГА URL:\n";
            result += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

            foreach (var kvp in parsed)
            {
                // Выравнивание: {kvp.Key,-25} — ключ занимает минимум 25 символов,
                // выровнен по левому краю (знак минус).
                result += $"  {kvp.Key,-25} {kvp.Value}\n";
            }

            TxtResults.Text = result;

            // Добавляем запись в историю
            AddToHistory(url, "Анализ URL выполнен");
        }

        // ========================== PING ==========================

        /// <summary>
        /// Обработчик кнопки "Ping".
        /// 
        /// ПОЯСНЕНИЕ ОБ АСИНХРОННОСТИ:
        /// Метод помечен как "async" — это значит, что он содержит
        /// асинхронные операции (await).
        /// 
        /// ЗАЧЕМ async/await?
        /// Ping может занять несколько секунд. Если выполнять его синхронно
        /// (в основном потоке UI), то окно приложения "заморозится" — 
        /// пользователь не сможет нажимать кнопки, двигать окно и т.д.
        /// 
        /// async/await позволяет "отпустить" UI-поток на время ожидания ответа.
        /// Когда ответ придёт, выполнение продолжится в UI-потоке.
        /// 
        /// Обратите внимание: обработчик возвращает async void (не async Task),
        /// потому что обработчики событий WPF должны иметь сигнатуру void.
        /// Это единственный допустимый случай использования async void.
        /// </summary>
        private async void BtnPing_Click(object sender, RoutedEventArgs e)
        {
            string url = TxtUrl.Text.Trim();

            if (string.IsNullOrEmpty(url))
            {
                TxtResults.Text = "⚠️ Введите URL для проверки!";
                return;
            }

            // Извлекаем хост из URL (если введён полный URL)
            string host = ExtractHost(url);

            // Показываем индикатор загрузки
            TxtResults.Text = $"⏳ Выполняется ping {host}...";
            BtnPing.IsEnabled = false;  // Блокируем кнопку на время выполнения

            try
            {
                // await — "подождать" результат асинхронной операции,
                // НЕ блокируя UI-поток.
                string result = await _networkService.PingHostAsync(host);
                TxtResults.Text = result;

                // Добавляем в историю
                string status = result.Contains("✅") ? "Доступен" : "Недоступен";
                AddToHistory(url, $"Ping: {status}");
            }
            finally
            {
                // finally — код, который выполнится ВСЕГДА (даже при ошибке).
                // Разблокируем кнопку.
                BtnPing.IsEnabled = true;
            }
        }

        // ========================== DNS ==========================

        /// <summary>
        /// Обработчик кнопки "DNS".
        /// Получает DNS-информацию о хосте (IP-адреса, алиасы).
        /// Также асинхронный, т.к. DNS-запрос — сетевая операция.
        /// </summary>
        private async void BtnDns_Click(object sender, RoutedEventArgs e)
        {
            string url = TxtUrl.Text.Trim();

            if (string.IsNullOrEmpty(url))
            {
                TxtResults.Text = "⚠️ Введите URL для DNS-запроса!";
                return;
            }

            string host = ExtractHost(url);

            TxtResults.Text = $"⏳ Выполняется DNS-запрос для {host}...";
            BtnDns.IsEnabled = false;

            try
            {
                string result = await _networkService.GetDnsInfoAsync(host);
                TxtResults.Text = result;
                AddToHistory(url, "DNS-запрос выполнен");
            }
            finally
            {
                BtnDns.IsEnabled = true;
            }
        }

        // ========================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========================

        /// <summary>
        /// Извлекает хост (доменное имя или IP) из URL-строки.
        /// 
        /// ПОЯСНЕНИЕ:
        /// Пользователь может ввести как полный URL (https://example.com/path),
        /// так и просто доменное имя (example.com).
        /// Для Ping и DNS нам нужен только хост, без протокола и пути.
        /// 
        /// Uri.TryCreate пытается распарсить строку как URL.
        /// Если получается — берём uri.Host (только доменное имя).
        /// Если нет — возвращаем строку как есть (может быть просто IP или домен).
        /// </summary>
        private string ExtractHost(string url)
        {
            if (Uri.TryCreate(url, UriKind.Absolute, out Uri? uri))
            {
                return uri.Host;
            }
            // Если нет протокола, пробуем добавить https://
            if (Uri.TryCreate("https://" + url, UriKind.Absolute, out Uri? uri2))
            {
                return uri2.Host;
            }
            return url;
        }

        /// <summary>
        /// Добавляет запись в историю проверок.
        /// Новые записи добавляются в начало списка (Insert(0, ...)),
        /// чтобы последняя проверка была сверху.
        /// </summary>
        private void AddToHistory(string url, string result)
        {
            _urlHistory.Insert(0, new UrlHistoryItem
            {
                Url = url,
                CheckedAt = DateTime.Now,
                Result = result
            });
        }

        /// <summary>
        /// Очищает область результатов.
        /// </summary>
        private void BtnClear_Click(object sender, RoutedEventArgs e)
        {
            TxtResults.Text = "Результаты очищены.";
            TxtUrl.Text = string.Empty;
        }

        /// <summary>
        /// Очищает историю проверок.
        /// ObservableCollection.Clear() автоматически обновит ListBox.
        /// </summary>
        private void BtnClearHistory_Click(object sender, RoutedEventArgs e)
        {
            _urlHistory.Clear();
        }
    }
}
