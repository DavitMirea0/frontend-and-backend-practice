using System;

namespace NetworkAnalyzer.Models
{
    /// <summary>
    /// Модель для хранения записи в истории проверенных URL.
    /// 
    /// ПОЯСНЕНИЕ:
    /// Каждый раз, когда пользователь анализирует URL, создаётся экземпляр
    /// этого класса и добавляется в коллекцию истории.
    /// Это позволяет вести журнал всех проверенных адресов.
    /// </summary>
    public class UrlHistoryItem
    {
        /// <summary>
        /// Проверенный URL-адрес
        /// </summary>
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// Дата и время проверки
        /// </summary>
        public DateTime CheckedAt { get; set; }

        /// <summary>
        /// Результат проверки (доступен/недоступен/ошибка)
        /// </summary>
        public string Result { get; set; } = string.Empty;

        /// <summary>
        /// Для отображения в ListBox
        /// </summary>
        public override string ToString() => $"[{CheckedAt:HH:mm:ss}] {Url} — {Result}";
    }
}
