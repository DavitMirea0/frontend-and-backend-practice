using System;

namespace HttpMonitor.Models
{
    /// <summary>
    /// Модель сообщения, сохранённого на сервере через POST-запрос.
    /// При POST-запросе с JSON {"message": "текст"} сервер сохраняет его
    /// и возвращает уникальный идентификатор.
    /// </summary>
    public class StoredMessage
    {
        /// <summary>
        /// Уникальный идентификатор сообщения (GUID)
        /// </summary>
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Текст сообщения
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Время получения сообщения
        /// </summary>
        public DateTime ReceivedAt { get; set; } = DateTime.Now;
    }
}
