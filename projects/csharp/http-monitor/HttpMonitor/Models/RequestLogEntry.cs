using System;

namespace HttpMonitor.Models
{
    /// <summary>
    /// Модель записи лога HTTP-запроса.
    /// Хранит всю информацию о входящем или исходящем запросе.
    /// </summary>
    public class RequestLogEntry
    {
        /// <summary>
        /// Уникальный идентификатор записи
        /// </summary>
        public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];

        /// <summary>
        /// Временная метка запроса
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.Now;

        /// <summary>
        /// Направление: "Входящий" или "Исходящий"
        /// </summary>
        public string Direction { get; set; } = string.Empty;

        /// <summary>
        /// HTTP-метод: GET, POST и т.д.
        /// </summary>
        public string Method { get; set; } = string.Empty;

        /// <summary>
        /// URL запроса
        /// </summary>
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// HTTP-статус ответа (200, 404, 500 и т.д.)
        /// </summary>
        public int StatusCode { get; set; }

        /// <summary>
        /// Заголовки запроса
        /// </summary>
        public string Headers { get; set; } = string.Empty;

        /// <summary>
        /// Тело запроса
        /// </summary>
        public string RequestBody { get; set; } = string.Empty;

        /// <summary>
        /// Тело ответа
        /// </summary>
        public string ResponseBody { get; set; } = string.Empty;

        /// <summary>
        /// Время обработки в миллисекундах
        /// </summary>
        public long ProcessingTimeMs { get; set; }

        /// <summary>
        /// Форматированное отображение для логов
        /// </summary>
        public string DisplayText => $"[{Timestamp:HH:mm:ss}] {Direction} {Method} {Url} → {StatusCode} ({ProcessingTimeMs}мс)";

        /// <summary>
        /// Для фильтрации
        /// </summary>
        public override string ToString() => DisplayText;
    }
}
