using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using HttpMonitor.Models;

namespace HttpMonitor.Services
{
    /// <summary>
    /// Сервис HTTP-клиента для отправки запросов.
    /// 
    /// HttpClient — класс .NET для выполнения HTTP-запросов.
    /// ВАЖНО: HttpClient рекомендуется использовать как ЕДИНСТВЕННЫЙ экземпляр
    /// на всё приложение (Singleton), чтобы избежать исчерпания сокетов.
    /// </summary>
    public class HttpClientService
    {
        // Единственный экземпляр HttpClient на всё время работы приложения
        private readonly HttpClient _client;

        /// <summary>
        /// Событие: новая запись лога
        /// </summary>
        public event Action<RequestLogEntry>? OnLogEntry;

        public HttpClientService()
        {
            _client = new HttpClient
            {
                // Таймаут запроса — 30 секунд
                Timeout = TimeSpan.FromSeconds(30)
            };
        }

        /// <summary>
        /// Отправить GET-запрос на указанный URL.
        /// 
        /// GetAsync() — асинхронно отправляет GET-запрос.
        /// Возвращает HttpResponseMessage с кодом статуса и телом ответа.
        /// </summary>
        public async Task<(string response, int statusCode)> SendGetAsync(string url)
        {
            var sw = Stopwatch.StartNew();
            var logEntry = new RequestLogEntry
            {
                Direction = "Исходящий",
                Method = "GET",
                Url = url
            };

            try
            {
                var response = await _client.GetAsync(url);
                var body = await response.Content.ReadAsStringAsync();

                sw.Stop();
                logEntry.StatusCode = (int)response.StatusCode;
                logEntry.ResponseBody = body;
                logEntry.ProcessingTimeMs = sw.ElapsedMilliseconds;
                logEntry.Headers = FormatResponseHeaders(response);

                OnLogEntry?.Invoke(logEntry);

                return (body, (int)response.StatusCode);
            }
            catch (Exception ex)
            {
                sw.Stop();
                logEntry.StatusCode = 0;
                logEntry.ResponseBody = $"Ошибка: {ex.Message}";
                logEntry.ProcessingTimeMs = sw.ElapsedMilliseconds;

                OnLogEntry?.Invoke(logEntry);

                return ($"Ошибка: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Отправить POST-запрос с JSON-телом.
        /// 
        /// StringContent — обёртка для передачи строки как тела HTTP-запроса.
        /// Указываем Content-Type: application/json для JSON-данных.
        /// </summary>
        public async Task<(string response, int statusCode)> SendPostAsync(string url, string jsonBody)
        {
            var sw = Stopwatch.StartNew();
            var logEntry = new RequestLogEntry
            {
                Direction = "Исходящий",
                Method = "POST",
                Url = url,
                RequestBody = jsonBody
            };

            try
            {
                var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
                var response = await _client.PostAsync(url, content);
                var body = await response.Content.ReadAsStringAsync();

                sw.Stop();
                logEntry.StatusCode = (int)response.StatusCode;
                logEntry.ResponseBody = body;
                logEntry.ProcessingTimeMs = sw.ElapsedMilliseconds;
                logEntry.Headers = FormatResponseHeaders(response);

                OnLogEntry?.Invoke(logEntry);

                return (body, (int)response.StatusCode);
            }
            catch (Exception ex)
            {
                sw.Stop();
                logEntry.StatusCode = 0;
                logEntry.ResponseBody = $"Ошибка: {ex.Message}";
                logEntry.ProcessingTimeMs = sw.ElapsedMilliseconds;

                OnLogEntry?.Invoke(logEntry);

                return ($"Ошибка: {ex.Message}", 0);
            }
        }

        /// <summary>
        /// Форматирование заголовков ответа для логирования.
        /// </summary>
        private string FormatResponseHeaders(HttpResponseMessage response)
        {
            var sb = new StringBuilder();
            foreach (var header in response.Headers)
            {
                sb.AppendLine($"{header.Key}: {string.Join(", ", header.Value)}");
            }
            foreach (var header in response.Content.Headers)
            {
                sb.AppendLine($"{header.Key}: {string.Join(", ", header.Value)}");
            }
            return sb.ToString();
        }
    }
}
