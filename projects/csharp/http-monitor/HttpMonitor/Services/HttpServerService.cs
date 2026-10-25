using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using HttpMonitor.Models;
using Newtonsoft.Json;

namespace HttpMonitor.Services
{
    /// <summary>
    /// Сервис HTTP-сервера на базе HttpListener.
    /// 
    /// HttpListener — класс .NET, реализующий простой HTTP-сервер.
    /// Он использует HTTP.sys (системный драйвер Windows) для приёма запросов.
    /// 
    /// Многопоточность обеспечивается через async/await и Task.Run:
    /// каждый входящий запрос обрабатывается в отдельной задаче.
    /// 
    /// ConcurrentBag — потокобезопасная коллекция для хранения сообщений.
    /// </summary>
    public class HttpServerService
    {
        // HTTP-слушатель — основной класс сервера
        private HttpListener? _listener;

        // Токен отмены для корректной остановки сервера
        private CancellationTokenSource? _cts;

        // Потокобезопасное хранилище сообщений (POST-запросы)
        private readonly ConcurrentBag<StoredMessage> _messages = new();

        // Все записи логов для статистики
        private readonly ConcurrentBag<RequestLogEntry> _logEntries = new();

        // Счётчик запросов по минутам (для графика нагрузки)
        private readonly ConcurrentDictionary<string, int> _requestsPerMinute = new();

        // Время запуска сервера
        private DateTime? _startedAt;

        /// <summary>
        /// Событие: новая запись лога (для обновления UI)
        /// </summary>
        public event Action<RequestLogEntry>? OnLogEntry;

        /// <summary>
        /// Событие: статистика обновлена
        /// </summary>
        public event Action<ServerStatistics>? OnStatisticsUpdated;

        /// <summary>
        /// Флаг работы сервера
        /// </summary>
        public bool IsRunning => _listener?.IsListening ?? false;

        /// <summary>
        /// Запуск HTTP-сервера на указанном порту.
        /// 
        /// HttpListener.Prefixes — список URI-префиксов, которые сервер будет слушать.
        /// Формат: "http://+:порт/" — слушать на всех интерфейсах.
        /// "http://localhost:порт/" — только локальные запросы (без прав администратора).
        /// </summary>
        public async Task StartAsync(int port)
        {
            if (IsRunning) return;

            _listener = new HttpListener();
            // Используем localhost — не требует прав администратора
            _listener.Prefixes.Add($"http://localhost:{port}/");
            _listener.Start();

            _cts = new CancellationTokenSource();
            _startedAt = DateTime.Now;

            // Запускаем цикл приёма запросов в фоновом потоке
            _ = Task.Run(() => AcceptRequestsLoop(_cts.Token));
        }

        /// <summary>
        /// Остановка сервера.
        /// </summary>
        public void Stop()
        {
            _cts?.Cancel();
            _listener?.Stop();
            _listener?.Close();
            _listener = null;
            _startedAt = null;
        }

        /// <summary>
        /// Получить текущую статистику сервера.
        /// </summary>
        public ServerStatistics GetStatistics()
        {
            var entries = _logEntries.ToArray();
            return new ServerStatistics
            {
                TotalRequests = entries.Length,
                GetRequests = entries.Count(e => e.Method == "GET"),
                PostRequests = entries.Count(e => e.Method == "POST"),
                AverageProcessingTimeMs = entries.Length > 0
                    ? entries.Average(e => e.ProcessingTimeMs)
                    : 0,
                StartedAt = _startedAt,
                StoredMessages = _messages.Count
            };
        }

        /// <summary>
        /// Получить данные о запросах по минутам (для графика).
        /// </summary>
        public Dictionary<string, int> GetRequestsPerMinute()
        {
            return _requestsPerMinute.ToDictionary(kv => kv.Key, kv => kv.Value);
        }

        /// <summary>
        /// Получить все логи для фильтрации.
        /// </summary>
        public List<RequestLogEntry> GetAllLogs()
        {
            return _logEntries.ToList();
        }

        /// <summary>
        /// Основной цикл приёма запросов.
        /// 
        /// GetContextAsync() — асинхронно ожидает входящий HTTP-запрос.
        /// Каждый запрос обрабатывается в отдельной задаче (Task.Run),
        /// что обеспечивает многопоточную обработку.
        /// </summary>
        private async Task AcceptRequestsLoop(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested && _listener != null && _listener.IsListening)
            {
                try
                {
                    // Ожидаем входящий запрос
                    var context = await _listener.GetContextAsync();

                    // Обрабатываем каждый запрос в отдельном потоке
                    _ = Task.Run(() => HandleRequest(context), ct);
                }
                catch (HttpListenerException)
                {
                    // Возникает при остановке сервера — нормальное поведение
                    break;
                }
                catch (ObjectDisposedException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Ошибка приёма запроса: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Обработка одного HTTP-запроса.
        /// 
        /// HttpListenerContext содержит:
        ///   - Request  — входящий запрос (метод, URL, заголовки, тело)
        ///   - Response — объект ответа (статус, заголовки, тело)
        /// 
        /// Stopwatch — высокоточный таймер для замера времени обработки.
        /// </summary>
        private async Task HandleRequest(HttpListenerContext context)
        {
            var sw = Stopwatch.StartNew();
            var request = context.Request;
            var response = context.Response;

            var logEntry = new RequestLogEntry
            {
                Direction = "Входящий",
                Method = request.HttpMethod,
                Url = request.Url?.PathAndQuery ?? "/",
                Headers = FormatHeaders(request.Headers)
            };

            try
            {
                // Читаем тело запроса (если есть)
                string requestBody = "";
                if (request.HasEntityBody)
                {
                    using var reader = new StreamReader(request.InputStream, request.ContentEncoding);
                    requestBody = await reader.ReadToEndAsync();
                    logEntry.RequestBody = requestBody;
                }

                string responseBody;
                int statusCode;

                // Маршрутизация по HTTP-методу
                switch (request.HttpMethod)
                {
                    case "GET":
                        (responseBody, statusCode) = HandleGetRequest(request);
                        break;
                    case "POST":
                        (responseBody, statusCode) = HandlePostRequest(requestBody);
                        break;
                    default:
                        responseBody = JsonConvert.SerializeObject(new { error = "Метод не поддерживается" });
                        statusCode = 405; // Method Not Allowed
                        break;
                }

                // Формируем HTTP-ответ
                response.StatusCode = statusCode;
                response.ContentType = "application/json; charset=utf-8";

                // Добавляем CORS-заголовки (для возможности запросов из браузера)
                response.Headers.Add("Access-Control-Allow-Origin", "*");

                byte[] buffer = Encoding.UTF8.GetBytes(responseBody);
                response.ContentLength64 = buffer.Length;
                await response.OutputStream.WriteAsync(buffer);

                logEntry.StatusCode = statusCode;
                logEntry.ResponseBody = responseBody;
            }
            catch (Exception ex)
            {
                response.StatusCode = 500;
                var errorJson = JsonConvert.SerializeObject(new { error = ex.Message });
                byte[] buffer = Encoding.UTF8.GetBytes(errorJson);
                response.ContentLength64 = buffer.Length;
                await response.OutputStream.WriteAsync(buffer);

                logEntry.StatusCode = 500;
                logEntry.ResponseBody = errorJson;
            }
            finally
            {
                response.Close();
                sw.Stop();
                logEntry.ProcessingTimeMs = sw.ElapsedMilliseconds;

                // Сохраняем запись лога
                _logEntries.Add(logEntry);

                // Обновляем счётчик запросов в минуту
                var minuteKey = DateTime.Now.ToString("HH:mm");
                _requestsPerMinute.AddOrUpdate(minuteKey, 1, (_, count) => count + 1);

                // Уведомляем UI
                OnLogEntry?.Invoke(logEntry);
                OnStatisticsUpdated?.Invoke(GetStatistics());
            }
        }

        /// <summary>
        /// Обработка GET-запроса.
        /// Возвращает статус сервера: количество запросов, время работы, сообщения.
        /// </summary>
        private (string body, int status) HandleGetRequest(HttpListenerRequest request)
        {
            var path = request.Url?.AbsolutePath ?? "/";

            if (path == "/messages")
            {
                // GET /messages — список всех сохранённых сообщений
                var messages = _messages.OrderByDescending(m => m.ReceivedAt).ToList();
                return (JsonConvert.SerializeObject(messages, Formatting.Indented), 200);
            }

            // GET / или GET /status — статус сервера
            var stats = GetStatistics();
            var statusResponse = new
            {
                status = "Сервер работает",
                uptime = stats.Uptime,
                totalRequests = stats.TotalRequests,
                getRequests = stats.GetRequests,
                postRequests = stats.PostRequests,
                averageProcessingTimeMs = Math.Round(stats.AverageProcessingTimeMs, 2),
                storedMessages = stats.StoredMessages,
                serverTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };
            return (JsonConvert.SerializeObject(statusResponse, Formatting.Indented), 200);
        }

        /// <summary>
        /// Обработка POST-запроса.
        /// Принимает JSON {"message": "текст"}, сохраняет и возвращает ID.
        /// </summary>
        private (string body, int status) HandlePostRequest(string requestBody)
        {
            try
            {
                // Десериализуем JSON в динамический объект
                var data = JsonConvert.DeserializeObject<Dictionary<string, string>>(requestBody);

                if (data == null || !data.ContainsKey("message"))
                {
                    var errorResponse = new { error = "Неверный формат JSON. Ожидается: {\"message\": \"текст\"}" };
                    return (JsonConvert.SerializeObject(errorResponse), 400); // Bad Request
                }

                // Создаём и сохраняем сообщение
                var message = new StoredMessage
                {
                    Message = data["message"]
                };
                _messages.Add(message);

                var successResponse = new
                {
                    success = true,
                    id = message.Id,
                    message = message.Message,
                    receivedAt = message.ReceivedAt.ToString("yyyy-MM-dd HH:mm:ss")
                };
                return (JsonConvert.SerializeObject(successResponse, Formatting.Indented), 201); // Created
            }
            catch (JsonException)
            {
                var errorResponse = new { error = "Невалидный JSON" };
                return (JsonConvert.SerializeObject(errorResponse), 400);
            }
        }

        /// <summary>
        /// Форматирование HTTP-заголовков для отображения в логах.
        /// </summary>
        private string FormatHeaders(System.Collections.Specialized.NameValueCollection headers)
        {
            var sb = new StringBuilder();
            foreach (string? key in headers.AllKeys)
            {
                if (key != null)
                    sb.AppendLine($"{key}: {headers[key]}");
            }
            return sb.ToString();
        }
    }
}
