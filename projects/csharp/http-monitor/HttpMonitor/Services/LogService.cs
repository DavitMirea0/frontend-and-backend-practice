using System;
using System.IO;
using System.Text;
using HttpMonitor.Models;

namespace HttpMonitor.Services
{
    /// <summary>
    /// Сервис логирования в файл.
    /// Записывает все HTTP-запросы в текстовый файл logs.txt.
    /// 
    /// Используется lock для потокобезопасной записи:
    /// несколько потоков могут одновременно пытаться записать лог,
    /// lock гарантирует, что запись будет последовательной.
    /// </summary>
    public class LogService
    {
        private readonly string _logFilePath;
        private readonly object _writeLock = new();

        public LogService(string logFilePath = "logs.txt")
        {
            _logFilePath = logFilePath;
        }

        /// <summary>
        /// Записать запись лога в файл.
        /// </summary>
        public void WriteLog(RequestLogEntry entry)
        {
            var sb = new StringBuilder();
            sb.AppendLine("═══════════════════════════════════════════════");
            sb.AppendLine($"  Время:       {entry.Timestamp:yyyy-MM-dd HH:mm:ss.fff}");
            sb.AppendLine($"  Направление: {entry.Direction}");
            sb.AppendLine($"  Метод:       {entry.Method}");
            sb.AppendLine($"  URL:         {entry.Url}");
            sb.AppendLine($"  Статус:      {entry.StatusCode}");
            sb.AppendLine($"  Время (мс):  {entry.ProcessingTimeMs}");

            if (!string.IsNullOrWhiteSpace(entry.Headers))
            {
                sb.AppendLine($"  Заголовки:");
                foreach (var line in entry.Headers.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                    sb.AppendLine($"    {line.Trim()}");
            }

            if (!string.IsNullOrWhiteSpace(entry.RequestBody))
            {
                sb.AppendLine($"  Тело запроса:");
                sb.AppendLine($"    {entry.RequestBody}");
            }

            if (!string.IsNullOrWhiteSpace(entry.ResponseBody))
            {
                // Ограничиваем длину тела ответа в логе
                var responsePreview = entry.ResponseBody.Length > 500
                    ? entry.ResponseBody[..500] + "..."
                    : entry.ResponseBody;
                sb.AppendLine($"  Тело ответа:");
                sb.AppendLine($"    {responsePreview}");
            }

            sb.AppendLine();

            // Потокобезопасная запись в файл
            lock (_writeLock)
            {
                File.AppendAllText(_logFilePath, sb.ToString(), Encoding.UTF8);
            }
        }

        /// <summary>
        /// Путь к файлу логов (для отображения в UI).
        /// </summary>
        public string LogFilePath => Path.GetFullPath(_logFilePath);
    }
}
