using System;

namespace HttpMonitor.Models
{
    /// <summary>
    /// Модель статистики сервера для отображения в мониторинге.
    /// </summary>
    public class ServerStatistics
    {
        /// <summary>
        /// Общее количество обработанных запросов
        /// </summary>
        public int TotalRequests { get; set; }

        /// <summary>
        /// Количество GET-запросов
        /// </summary>
        public int GetRequests { get; set; }

        /// <summary>
        /// Количество POST-запросов
        /// </summary>
        public int PostRequests { get; set; }

        /// <summary>
        /// Среднее время обработки в миллисекундах
        /// </summary>
        public double AverageProcessingTimeMs { get; set; }

        /// <summary>
        /// Время запуска сервера
        /// </summary>
        public DateTime? StartedAt { get; set; }

        /// <summary>
        /// Время работы сервера (Uptime)
        /// </summary>
        public string Uptime => StartedAt.HasValue
            ? (DateTime.Now - StartedAt.Value).ToString(@"hh\:mm\:ss")
            : "—";

        /// <summary>
        /// Количество сохранённых сообщений
        /// </summary>
        public int StoredMessages { get; set; }
    }
}
